export interface StrumPreset {
    label: string;
    pattern: string; // 8 chars: D (down), U (up), - (rest)
}

export const STRUM_PRESETS: StrumPreset[] = [
    { label: "All Downs", pattern: "D-D-D-D-" },
    { label: "Down / Up", pattern: "DUDUDUDU" },
    { label: "D-D-U-U-D-U", pattern: "DDUUDU--" },
    { label: "Syncopated", pattern: "D--UDU-U" },
];

export const DEFAULT_STRUM_PATTERN = "D-D-D-D-";