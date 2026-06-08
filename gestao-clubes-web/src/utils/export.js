import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Funções de exportação de CSV (sem alterações) ---

function arrayToCsv(data, columns, separator = ';') {
    const header = columns.map(c => c.label).join(separator);
    const rows = data.map(row => {
        return columns.map(col => {
            const value = row[col.key] ?? '';
            const strValue = String(value).replace(/"/g, '""'); 
            return `"${strValue}"`;
        }).join(separator);
    });
    return [header, ...rows].join('\n');
}

function downloadCsv(csvString, filename = 'export.csv') {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export function exportToCsv(data, columns, filename) {
    const csv = arrayToCsv(data, columns);
    downloadCsv(csv, filename);
}

// --- Novas funções e melhorias para exportação de PDF ---

const PLATFORM_LOGO_URL = "/LOGO_GCDC04.png"; // Caminho para o logo da plataforma nos assets

/**
 * Converte uma imagem de um URL para uma string Base64.
 * Trata de CORS e falhas de carregamento.
 * @param {string} url - O URL da imagem.
 * @returns {Promise<string|null>} A string Base64 ou null em caso de erro.
 */
async function imageToBase64(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Erro ao carregar imagem para PDF:", error);
    return null;
  }
}

/**
 * Função auxiliar que gera o documento PDF base formatado, agora com cabeçalho e rodapé melhorados.
 * @param {object} options - Opções para a geração do PDF.
 * @returns {Promise<jsPDF>} O documento PDF gerado.
 */
// eslint-disable-next-line new-cap
async function generatePdfDoc(options) {
    const { data, columns, title, clubName, clubLogoUrl, summary, athletePhotoUrl } = options;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Carregar imagens em paralelo
    const [platformLogoB64, clubLogoB64, athletePhotoB64] = await Promise.all([
        imageToBase64(PLATFORM_LOGO_URL),
        imageToBase64(clubLogoUrl),
        imageToBase64(athletePhotoUrl)
    ]);

    // --- Cabeçalho ---
    if (platformLogoB64) {
        doc.addImage(platformLogoB64, 'PNG', margin, 10, 20, 20); // x, y, w, h
    }
    if (clubLogoB64) {
        doc.addImage(clubLogoB64, 'PNG', pageW - margin - 20, 10, 20, 20);
    }
    
    doc.setFontSize(16);
    doc.setTextColor(20);
    doc.text(title, pageW / 2, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(80);
    if (clubName) {
        doc.text(clubName, pageW / 2, 28, { align: "center" });
    }

    const dateStr = new Date().toLocaleDateString("pt-PT");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Gerado em: ${dateStr}`, pageW / 2, 34, { align: "center" });
    
    let startY = 45;

    // Foto do atleta (se existir)
    if (athletePhotoB64) {
        doc.addImage(athletePhotoB64, 'PNG', margin, startY, 30, 30);
        startY += 40;
    }

    if (summary) {
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text(summary, margin, startY - 5);
        startY += 10;
    }

    // --- Tabela de Dados ---
    const tableColumnLabels = columns.map(c => c.label);
    const tableData = data.map(row => columns.map(c => String(row[c.key] ?? '')));

    autoTable(doc, {
        startY,
        head: [tableColumnLabels],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [41, 128, 185], 
            textColor: 255,
            fontSize: 10,
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250],
        },
        didDrawPage: function () { // Removido o parâmetro '_data'
            // --- Rodapé ---
            const pageH = doc.internal.pageSize.getHeight();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                "Plataforma de Gestão de Coletividades",
                margin,
                pageH - 10
            );
            doc.text(
                `Página ${doc.internal.getNumberOfPages()}`,
                pageW - margin,
                pageH - 10,
                { align: "right" }
            );
        },
    });

    return doc;
}

/**
 * Exporta dados para um ficheiro PDF formatado e inicia o download.
 * @param {object} options - Opções para a geração do PDF.
 */
export async function exportToPdf(options) {
    const { filename = "export.pdf" } = options;
    try {
        const doc = await generatePdfDoc(options);
        doc.save(filename);
    } catch (error) {
        console.error("Falha ao gerar PDF para exportação:", error);
        alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
    }
}

/**
 * Gera o PDF e abre-o num novo separador para impressão.
 * @param {object} options - Opções para a geração do PDF.
 */
export async function printPdf(options) {
    try {
        const doc = await generatePdfDoc(options);
        doc.autoPrint();
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        if (!printWindow) {
            alert("Por favor, permita pop-ups para imprimir o documento.");
        }
    } catch (error) {
        console.error("Falha ao gerar PDF para impressão:", error);
        alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
    }
}

/**
 * Antiga função de impressão da página HTML
 */
export function printTable() {
    window.print();
}