// Small, dependency-free way to turn a song into a "random but consistent"
// pair of gradients. Same song id -> same gradient, every render, without
// storing gradient data on the backend.

const COVER_GRADIENTS = [
    "linear-gradient(135deg, #1e3c72, #2a5298)",
    "linear-gradient(135deg, #3a1c33, #1a0f1a)",
    "linear-gradient(135deg, #c31432, #240b36)",
    "linear-gradient(135deg, #2c3e50, #000000)",
    "linear-gradient(135deg, #654ea3, #eaafc8)",
    "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
];

const LABEL_GRADIENTS = [
    "radial-gradient(circle, #f7f7f7, #d4d4d4)",
    "radial-gradient(circle, #ffd700, #b8860b)",
    "radial-gradient(circle, #ff6b6b, #c0392b)",
    "radial-gradient(circle, #a8e6cf, #55efc4)",
    "radial-gradient(circle, #ff9a9e, #fecfef)",
];

export function coverGradientFor(songId: number): string {
    return COVER_GRADIENTS[songId % COVER_GRADIENTS.length];
}

export function labelGradientFor(songId: number): string {
    return LABEL_GRADIENTS[songId % LABEL_GRADIENTS.length];
}