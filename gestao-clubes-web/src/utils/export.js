import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Converte um array de objetos para uma string CSV.
 * @param {Array<Object>} data - O array de dados.
 * @param {Array<{key: string, label: string}>} columns - As colunas a exportar.
 * @param {string} separator - O separador de campos (padrão ';').
 * @returns {string} A string CSV.
 */
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

export function downloadCsv(csvString, filename = 'export.csv') {
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

/**
 * Função auxiliar que gera o documento PDF base formatado.
 */
function generatePdfDoc(data, columns, title, clubName, summary) {
    const doc = new jsPDF();
    const platformName = "Gestão de Coletividades";
    const dateStr = new Date().toLocaleString("pt-PT");

    // Configurar o cabeçalho do documento
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(platformName, 14, 15);
    doc.text(`Data de criação: ${dateStr}`, doc.internal.pageSize.getWidth() - 14, 15, { align: "right" });

    doc.setFontSize(16);
    doc.setTextColor(20);
    const mainTitle = clubName ? `${clubName} - ${title}` : title;
    doc.text(mainTitle, 14, 25);

    if (summary) {
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text(summary, 14, 32);
    }

    // Preparar os dados para o AutoTable
    const tableColumnLabels = columns.map(c => c.label);
    const tableData = data.map(row => columns.map(c => String(row[c.key] ?? '')));

    autoTable(doc, {
        startY: summary ? 42 : 35,
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
        didDrawPage: function (data) {
            // Rodapé com número da página
            let str = "Página " + doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.text(
                str,
                data.settings.margin.left,
                doc.internal.pageSize.getHeight() - 10
            );
        },
    });

    return doc;
}

/**
 * Exporta dados para um ficheiro PDF formatado com tabela e inicia o download.
 */
export function exportToPdf(data, columns, title, clubName, filename, summary) {
    const doc = generatePdfDoc(data, columns, title, clubName, summary);
    doc.save(filename);
}

/**
 * Gera o documento PDF em memória e abre-o num novo separador 
 * instruindo o browser a abrir imediatamente a janela de impressão.
 */
export function printPdf(data, columns, title, clubName, summary) {
    const doc = generatePdfDoc(data, columns, title, clubName, summary);
    
    // Instruir o PDF a imprimir quando for aberto
    doc.autoPrint();
    
    // Criar um URL temporário com o conteúdo do PDF
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    
    // Abrir num novo separador
    const printWindow = window.open(url, '_blank');
    
    // Se o bloqueador de pop-ups impedir a abertura, avisamos o utilizador
    if (!printWindow) {
        alert("Por favor, permita pop-ups para imprimir o documento.");
    }
}

/**
 * Antiga função de impressão da página HTML
 */
export function printTable() {
    window.print();
}