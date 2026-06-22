import { useState, useMemo } from "react";

export function usePagination(data = [], defaultPageSize = 25) {
    const [page, setPageRaw] = useState(1);
    const [pageSize, setPageSizeRaw] = useState(defaultPageSize);

    const totalItems = Array.isArray(data) ? data.length : 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const safePage = Math.min(page, totalPages);

    const paginated = useMemo(() => {
        if (!Array.isArray(data)) return [];
        const start = (safePage - 1) * pageSize;
        return data.slice(start, start + pageSize);
    }, [data, safePage, pageSize]);

    function setPage(p) {
        setPageRaw(Math.max(1, Math.min(p, totalPages)));
    }

    function setPageSize(size) {
        setPageSizeRaw(size);
        setPageRaw(1);
    }

    function resetPage() {
        setPageRaw(1);
    }

    return { page: safePage, pageSize, setPage, setPageSize, paginated, totalPages, totalItems, resetPage };
}
