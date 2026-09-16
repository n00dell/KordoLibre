export function getArrowSequence(pattern: string | number): string[] {
    const str = String(pattern);

    // Current format: exactly 8 chars of D/U/-.
    if (/^[DU-]{8}$/i.test(str)) {
        return str.toUpperCase().split("").map((c) => (c === "D" ? "↓" : c === "U" ? "↑" : " "));
    }

    // Legacy fallback for old enum-named values already stored (DownDownUp, etc.)
    const lower = str.toLowerCase();
    if (lower.includes("downdownup") || lower.includes("0")) return ["↓", " ", "↓", "↑", " ", "↑", "↓", "↑"];
    if (lower.includes("down")) return ["↓", " ", "↓", " ", "↓", " ", "↓", " "];
    return ["↓", " ", "↓", "↑", " ", "↑", "↓", "↑"];
}