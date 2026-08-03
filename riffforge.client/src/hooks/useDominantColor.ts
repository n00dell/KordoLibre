import { useState, useEffect } from "react";

// Simple in-memory cache so we don't re-decode + re-sample the same image
// every time a card re-renders or the user navigates back to it.
const colorCache = new Map<string, string>();

function extractDominantColor(imageUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                // Downscale hard — we're bucketing colors, not rendering.
                // 32x32 is plenty and keeps this fast even for huge covers.
                const size = 32;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                if (!ctx) return resolve(null);

                ctx.drawImage(img, 0, 0, size, size);
                const { data } = ctx.getImageData(0, 0, size, size);

                // Bucket into coarse RGB bins (steps of 32) and count them.
                // This avoids "average = muddy brown" on high-contrast art.
                const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
                    if (a < 128) continue; // skip transparent pixels
                    // skip near-black/near-white — usually letterboxing, not the art's color
                    const lum = (r + g + b) / 3;
                    if (lum < 20 || lum > 235) continue;

                    const key = `${Math.round(r / 32)}-${Math.round(g / 32)}-${Math.round(b / 32)}`;
                    const existing = buckets.get(key);
                    if (existing) {
                        existing.count++;
                    } else {
                        buckets.set(key, { count: 1, r, g, b });
                    }
                }

                let best: { count: number; r: number; g: number; b: number } | null = null;
                for (const bucket of buckets.values()) {
                    if (!best || bucket.count > best.count) best = bucket;
                }

                if (!best) return resolve(null);
                resolve(`rgb(${best.r}, ${best.g}, ${best.b})`);
            } catch {
                // Tainted canvas (CORS) or decode failure — caller falls back.
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = imageUrl;
    });
}

function useDominantColor(imageUrl: string | undefined, fallback: string): string {

    const cachedOrFallback = (imageUrl && colorCache.get(imageUrl)) || fallback;
    const [extracted, setExtracted] = useState<{ url: string; color: string } | null>(null);

    useEffect(() => {
        // Nothing to subscribe to — bail before touching state at all.
        if (!imageUrl || colorCache.has(imageUrl)) return;

        let cancelled = false;
        extractDominantColor(imageUrl).then((result) => {
            if (cancelled || !result) return;
            colorCache.set(imageUrl, result);
            setExtracted({ url: imageUrl, color: result }); // fine: inside async callback
        });

        return () => {
            cancelled = true;
        };
    }, [imageUrl]);

    if (extracted && extracted.url === imageUrl) return extracted.color;
    return cachedOrFallback;
}

export default useDominantColor;