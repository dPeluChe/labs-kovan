/**
 * Fuzzy string matching utilities for agent tools
 */

/**
 * Calculate similarity between two strings (0-1, higher is better)
 *
 * Scoring rules, de mayor a menor confianza:
 * - 1.0  match exacto (case/trim-insensitive)
 * - 0.85 todas las palabras del término corto aparecen como palabras
 *        completas del largo ("civic" → "honda civic")
 * - 0.75 todas las palabras del término corto (≥3 chars) son prefijo de
 *        alguna palabra del largo ("cumple" → "cumpleaños de maría")
 * - else distancia de Levenshtein normalizada
 *
 * Nota: un substring que no respeta límites de palabra NO puntúa alto
 * ("ana" no debe hacer match con "mariana").
 */
export function stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return 1.0;

    const tokens1 = tokenize(s1);
    const tokens2 = tokenize(s2);
    const [shorter, longer] = tokens1.length <= tokens2.length ? [tokens1, tokens2] : [tokens2, tokens1];

    if (shorter.length > 0) {
        if (shorter.every((word) => longer.includes(word))) {
            return 0.85;
        }
        if (shorter.every((word) => word.length >= 3 && longer.some((w) => w.startsWith(word)))) {
            return 0.75;
        }
    }

    // Levenshtein distance
    const distance = levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    if (maxLength === 0) return 1.0;

    return 1 - (distance / maxLength);
}

function tokenize(value: string): string[] {
    return value.split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 0);
}

/**
 * Find best match from array of items
 * Returns the item with highest similarity score above threshold
 */
export function findBestMatch<T>(
    searchTerm: string,
    items: T[],
    getKey: (item: T) => string,
    threshold: number = 0.5
): T | null {
    let bestMatch: T | null = null;
    let bestScore = threshold;

    for (const item of items) {
        const itemKey = getKey(item);
        const score = stringSimilarity(searchTerm, itemKey);

        if (score > bestScore) {
            bestScore = score;
            bestMatch = item;
        }
    }

    return bestMatch;
}

/**
 * Find all matches above threshold, sorted by score
 */
export function findAllMatches<T>(
    searchTerm: string,
    items: T[],
    getKey: (item: T) => string,
    threshold: number = 0.5,
    limit: number = 5
): Array<{ item: T; score: number }> {
    const matches = items
        .map(item => ({
            item,
            score: stringSimilarity(searchTerm, getKey(item))
        }))
        .filter(match => match.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return matches;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,    // deletion
                    dp[i][j - 1] + 1,    // insertion
                    dp[i - 1][j - 1] + 1 // substitution
                );
            }
        }
    }

    return dp[m][n];
}
