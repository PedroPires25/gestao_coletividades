export default function Pagination({
    page,
    pageSize,
    totalPages,
    totalItems,
    setPage,
    setPageSize,
    pageSizeOptions = [10, 25, 50],
}) {
    if (totalItems === 0) return null;

    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);

    function buildPages() {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages = [];
        pages.push(1);
        if (page > 3) pages.push("…");
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
            pages.push(i);
        }
        if (page < totalPages - 2) pages.push("…");
        pages.push(totalPages);
        return pages;
    }

    const pages = buildPages();

    const btnBase = {
        background: "var(--bg-btn, rgba(255,255,255,0.08))",
        border: "1px solid var(--border, rgba(255,255,255,0.16))",
        color: "var(--text, rgba(255,255,255,0.94))",
        borderRadius: "8px",
        padding: "5px 11px",
        fontSize: "0.85rem",
        cursor: "pointer",
        transition: "background 0.15s",
        lineHeight: 1.4,
    };

    const btnActive = {
        ...btnBase,
        background: "var(--accent, #5b8cff)",
        border: "1px solid var(--accent, #5b8cff)",
        fontWeight: 700,
        cursor: "default",
    };

    const btnDisabled = {
        ...btnBase,
        opacity: 0.35,
        cursor: "not-allowed",
    };

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "16px",
            padding: "10px 4px 4px",
        }}>
            <span style={{ fontSize: "0.82rem", color: "var(--muted, rgba(255,255,255,0.74))" }}>
                {start}–{end} de {totalItems} registo{totalItems !== 1 ? "s" : ""}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <button
                    style={page === 1 ? btnDisabled : btnBase}
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    aria-label="Página anterior"
                >
                    ‹
                </button>

                {pages.map((p, i) =>
                    p === "…" ? (
                        <span key={`ellipsis-${i}`} style={{ color: "var(--muted)", padding: "0 2px" }}>…</span>
                    ) : (
                        <button
                            key={p}
                            style={p === page ? btnActive : btnBase}
                            onClick={() => p !== page && setPage(p)}
                            aria-current={p === page ? "page" : undefined}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    style={page === totalPages ? btnDisabled : btnBase}
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    aria-label="Próxima página"
                >
                    ›
                </button>
            </div>

            <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                style={{
                    background: "var(--bg-input, rgba(20,24,35,0.48))",
                    border: "1px solid var(--border, rgba(255,255,255,0.16))",
                    color: "var(--text, rgba(255,255,255,0.94))",
                    borderRadius: "8px",
                    padding: "5px 8px",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                }}
                aria-label="Itens por página"
            >
                {pageSizeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt} por página</option>
                ))}
            </select>
        </div>
    );
}
