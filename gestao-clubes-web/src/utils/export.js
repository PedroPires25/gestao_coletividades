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

const PLATFORM_LOGO_URL = "/LOGO_GCDC04.png";

function resolveImageUrl(url) {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function imageToData(url) {
    const resolved = resolveImageUrl(url);
    if (!resolved) return null;
    try {
        const response = await fetch(resolved, { mode: "cors" });
        if (!response.ok) return null;
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => resolve({ data: reader.result, width: img.width, height: img.height });
                img.onerror = () => resolve(null);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

const PLATFORM_LOGO_MAX_H = 18;
const PLATFORM_LOGO_MAX_W = 50;
const CLUB_LOGO_MAX_H = 15;
const CLUB_LOGO_MAX_W = 30;
const HEADER_TOP = 8;
const MARGIN = 14;
const ACCENT_COLOR = [41, 100, 200];

function fitLogoDimensions(imgW, imgH, maxH, maxW) {
    const ar = imgW / imgH;
    let h = maxH;
    let w = h * ar;
    if (w > maxW) { w = maxW; h = w / ar; }
    return { w, h };
}

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

    const [platformLogo, clubLogo, athletePhoto] = await Promise.all([
        imageToData(PLATFORM_LOGO_URL),
        imageToData(clubLogoUrl),
        imageToData(athletePhotoUrl),
    ]);

    // --- Cabeçalho ---
    if (platformLogo) {
        const { w, h } = fitLogoDimensions(platformLogo.width, platformLogo.height, PLATFORM_LOGO_MAX_H, PLATFORM_LOGO_MAX_W);
        doc.addImage(platformLogo.data, 'PNG', MARGIN, HEADER_TOP, w, h);
    }
    if (clubLogo) {
        const { w, h } = fitLogoDimensions(clubLogo.width, clubLogo.height, CLUB_LOGO_MAX_H, CLUB_LOGO_MAX_W);
        doc.addImage(clubLogo.data, 'PNG', pageW - MARGIN - w, HEADER_TOP, w, h);
    }

    doc.setFontSize(15);
    doc.setFont(undefined, "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(title, pageW / 2, HEADER_TOP + 9, { align: "center" });

    if (clubName) {
        doc.setFontSize(11);
        doc.setFont(undefined, "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(clubName, pageW / 2, HEADER_TOP + 16, { align: "center" });
    }

    const dateStr = new Date().toLocaleDateString("pt-PT", {
        day: "2-digit", month: "long", year: "numeric",
    });
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(`Gerado em ${dateStr}`, pageW / 2, HEADER_TOP + 22, { align: "center" });

    const separatorY = HEADER_TOP + PLATFORM_LOGO_MAX_H + 5;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, separatorY, pageW - MARGIN, separatorY);

    let cursorY = separatorY + 6;

    if (athletePhoto) {
        const photoMaxH = 30;
        const photoMaxW = 25;
        const { w: photoW, h: photoH } = fitLogoDimensions(athletePhoto.width, athletePhoto.height, photoMaxH, photoMaxW);
        doc.addImage(athletePhoto.data, 'JPEG', MARGIN, cursorY, photoW, photoH);

        const infoX = MARGIN + photoW + 8;
        let infoY = cursorY + 6;

        if (summary) {
            doc.setFontSize(11);
            doc.setFont(undefined, "bold");
            doc.setTextColor(20, 20, 20);
            const summaryLines = doc.splitTextToSize(summary, pageW - infoX - MARGIN);
            summaryLines.forEach(line => { doc.text(line, infoX, infoY); infoY += 6; });
            infoY += 1;
        }
        if (athleteInfo) {
            doc.setFontSize(9);
            doc.setFont(undefined, "normal");
            doc.setTextColor(70, 70, 70);
            const aiLines = doc.splitTextToSize(athleteInfo, pageW - infoX - MARGIN);
            aiLines.forEach(line => { doc.text(line, infoX, infoY); infoY += 5; });
        }
        if (filters) {
            doc.setFontSize(8.5);
            doc.setFont(undefined, "normal");
            doc.setTextColor(80, 80, 80);
            const filterParts = filters.split(' | ');
            filterParts.forEach(part => {
                const partLines = doc.splitTextToSize(part.trim(), pageW - infoX - MARGIN);
                partLines.forEach(line => { doc.text(line, infoX, infoY); infoY += 4.5; });
            });
        }

        cursorY += Math.max(photoH, infoY - cursorY) + 8;
    } else {
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

export function printTable() {
    window.print();
}