/**
 * Parsea fechas "YYYY-MM-DD" como fecha LOCAL del servidor.
 * `new Date("2026-06-10")` interpreta UTC y en zonas negativas (MX) corre
 * la fecha al día anterior; aquí se construye por componentes.
 * Devuelve null si la fecha es inválida (incluye casos tipo 2026-02-31,
 * que Date normalizaría en silencio).
 */
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseLocalDate(value: string): number | null {
    const match = ISO_DATE_RE.exec(value.trim());
    if (!match) {
        const fallback = new Date(value).getTime();
        return Number.isNaN(fallback) ? null : fallback;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return date.getTime();
}
