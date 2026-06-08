import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Funções de exportação de CSV ---

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

// --- Exportação de PDF ---

// O logo da plataforma é servido como asset público (funciona em localhost e Vercel/Render)
const PLATFORM_LOGO_URL = "/LOGO_GCDC04.png";

/**
 * Resolve um URL de imagem para URL absoluto.
 * Suporta: URLs Cloudinary (https://...), caminhos relativos (/uploads/...) e assets locais (/logo.png).
 */
function resolveImageUrl(url) {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    // Caminho relativo - resolver com base no origin atual
    return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Converte uma imagem num URL para Base64, com suporte a CORS e fallback seguro.
 * @param {string} url
 * @returns {Promise<string|null>}
 */
async function imageToBase64(url) {
    const resolved = resolveImageUrl(url);
    if (!resolved) return null;
    try {
        const response = await fetch(resolved, { mode: "cors" });
        if (!response.ok) return null;
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        // Imagem inacessível ou bloqueada por CORS — continua sem a imagem
        return null;
    }
}

const HEADER_LOGO_SIZE = 22;  // largura e altura dos logos no cabeçalho
const HEADER_TOP = 8;          // y inicial do cabeçalho
const HEADER_LOGO_Y = HEADER_TOP;
const MARGIN = 14;
const ACCENT_COLOR = [41, 100, 200]; // azul para cabeçalho da tabela

/**
 * Gera o documento PDF base com cabeçalho de identidade visual, corpo e rodapé.
 *
 * Opções suportadas:
 *  - data: array de objectos
 *  - columns: [{ key, label }]
 *  - title: string
 *  - clubName?: string
 *  - clubLogoUrl?: string  (URL completo ou relativo — será resolvido automaticamente)
 *  - summary?: string      (texto de resumo/filtros aplicados)
 *  - athletePhotoUrl?: string
 *  - athleteInfo?: string  (linha extra de info do atleta, ex: "Escalão: Sénior | Modalidade: Futebol")
 *  - filters?: string      (descrição dos filtros activos)
 */
async function generatePdfDoc(options) {
    const {
        data, columns, title,
        clubName, clubLogoUrl,
        summary, filters,
        athletePhotoUrl, athleteInfo,
    } = options;

    // eslint-disable-next-line new-cap
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Carregar todas as imagens em paralelo; falhas são silenciosas
    const [platformLogoB64, clubLogoB64, athletePhotoB64] = await Promise.all([
        imageToBase64(PLATFORM_LOGO_URL),
        imageToBase64(clubLogoUrl),
        imageToBase64(athletePhotoUrl),
    ]);

    // ── Cabeçalho ───────────────────────────────────────────────────────────────
    // Logo da plataforma (esquerda)
    if (platformLogoB64) {
        doc.addImage(platformLogoB64, 'PNG', MARGIN, HEADER_LOGO_Y, HEADER_LOGO_SIZE, HEADER_LOGO_SIZE);
    }
    // Logo do clube (direita)
    if (clubLogoB64) {
        doc.addImage(clubLogoB64, 'PNG', pageW - MARGIN - HEADER_LOGO_SIZE, HEADER_LOGO_Y, HEADER_LOGO_SIZE, HEADER_LOGO_SIZE);
    }

    // Título centrado
    doc.setFontSize(15);
    doc.setFont(undefined, "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(title, pageW / 2, HEADER_TOP + 9, { align: "center" });

    // Nome do clube
    if (clubName) {
        doc.setFontSize(11);
        doc.setFont(undefined, "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(clubName, pageW / 2, HEADER_TOP + 16, { align: "center" });
    }

    // Data de geração
    const dateStr = new Date().toLocaleDateString("pt-PT", {
        day: "2-digit", month: "long", year: "numeric",
    });
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(`Gerado em ${dateStr}`, pageW / 2, HEADER_TOP + 22, { align: "center" });

    // Linha separadora
    const separatorY = HEADER_TOP + HEADER_LOGO_SIZE + 5;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, separatorY, pageW - MARGIN, separatorY);

    let cursorY = separatorY + 6;

    // ── Bloco de identificação do atleta (se existir foto) ───────────────────
    if (athletePhotoB64) {
        const photoSize = 28;
        doc.addImage(athletePhotoB64, 'PNG', MARGIN, cursorY, photoSize, photoSize);

        // Informação do atleta à direita da foto
        const infoX = MARGIN + photoSize + 6;
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.setTextColor(20, 20, 20);
        if (summary) {
            // Dividir summary em linhas curtas para caber à direita da foto
            const summaryLines = doc.splitTextToSize(summary, pageW - infoX - MARGIN);
            summaryLines.forEach((line, i) => {
                doc.setFont(undefined, i === 0 ? "bold" : "normal");
                doc.setFontSize(i === 0 ? 10 : 9);
                doc.setTextColor(i === 0 ? 20 : 70);
                doc.text(line, infoX, cursorY + 7 + i * 5);
            });
        }
        if (athleteInfo) {
            doc.setFontSize(9);
            doc.setFont(undefined, "normal");
            doc.setTextColor(90, 90, 90);
            doc.text(athleteInfo, infoX, cursorY + 20);
        }
        cursorY += photoSize + 6;
    } else {
        // Sem foto: mostrar summary e filtros em texto simples
        if (summary) {
            doc.setFontSize(9);
            doc.setFont(undefined, "normal");
            doc.setTextColor(60, 60, 60);
            const lines = doc.splitTextToSize(summary, pageW - MARGIN * 2);
            doc.text(lines, MARGIN, cursorY);
            cursorY += lines.length * 5 + 3;
        }
        if (filters) {
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            const fLines = doc.splitTextToSize(`Filtros: ${filters}`, pageW - MARGIN * 2);
            doc.text(fLines, MARGIN, cursorY);
            cursorY += fLines.length * 4.5 + 3;
        }
    }

    cursorY += 2;

    // ── Tabela de dados ──────────────────────────────────────────────────────
    const tableColumnLabels = columns.map(c => c.label);
    const tableData = data.map(row => columns.map(c => String(row[c.key] ?? '')));

    autoTable(doc, {
        startY: cursorY,
        head: [tableColumnLabels],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: ACCENT_COLOR,
            textColor: 255,
            fontSize: 9,
            fontStyle: "bold",
        },
        styles: {
            fontSize: 8.5,
            cellPadding: 3,
            overflow: "linebreak",
        },
        alternateRowStyles: {
            fillColor: [245, 248, 255],
        },
        didDrawPage: (hookData) => {
            // ── Rodapé em cada página ────────────────────────────────────────
            const totalPages = doc.internal.getNumberOfPages();
            const currentPage = hookData.pageNumber;
            doc.setFontSize(8);
            doc.setFont(undefined, "normal");
            doc.setTextColor(160, 160, 160);
            doc.text(
                "Plataforma de Gestão de Coletividades",
                MARGIN,
                pageH - 8
            );
            doc.text(
                `Página ${currentPage} de ${totalPages}`,
                pageW - MARGIN,
                pageH - 8,
                { align: "right" }
            );
        },
    });

    return doc;
}

/**
 * Exporta dados para um ficheiro PDF e inicia o download.
 */
export async function exportToPdf(options) {
    const { filename = "export.pdf" } = options;
    try {
        const doc = await generatePdfDoc(options);
        doc.save(filename);
    } catch (error) {
        console.error("Falha ao gerar PDF:", error);
        alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
    }
}

/**
 * Gera o PDF e abre-o num novo separador para impressão.
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
 * Impressão directa da página HTML (fallback).
 */
export function printTable() {
    window.print();
}