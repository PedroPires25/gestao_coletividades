export async function extractApiErrorMessage(res, fallbackMessage) {
    const data = await res.json().catch(async () => {
        const text = await res.text().catch(() => "");
        return text ? { message: text } : null;
    });

    return data?.message || fallbackMessage;
}