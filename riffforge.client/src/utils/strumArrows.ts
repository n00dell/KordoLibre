export function getArrowSequence(p: string | number): string[] {
    const str = String(p).toLowerCase();
    if (str.includes("downdownup") || str.includes("0")) return ["↓", " ", "↓", "↑", " ", "↑", "↓", "↑"];
    if (str.includes("down")) return ["↓", " ", "↓", " ", "↓", " ", "↓", " "];
    return ["↓", " ", "↓", "↑", " ", "↑", "↓", "↑"];
}