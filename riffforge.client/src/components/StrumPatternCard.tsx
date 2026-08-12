// src/components/StrumPatternCard.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import StrumPatternDisplay from "./StrumPatternDisplay";

interface Props {
    pattern: string | number;
    bpm?: number;
}

export default function StrumPatternCard({ pattern, bpm = 120 }: Props) {
    const [playing, setPlaying] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<number | null>(null);

    // Parse pattern arrows to play audio
    const getArrows = (p: string | number) => {
        const str = String(p).toLowerCase();
        if (str.includes("downdownup") || str.includes("0")) {
            return ["↓", " ", "↓", "↑", " ", "↑", "↓", "↑"];
        }
        if (str.includes("down")) {
            return ["↓", " ", "↓", " ", "↓", " ", "↓", " "];
        }
        return ["↓", " ", "↓", "↑", " ", "↑", "↓", "↑"];
    };

    const arrows = getArrows(pattern);

    const STRING_FREQS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];


    const playStrumSound = useCallback((isDown: boolean) => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume();

        const now = ctx.currentTime;
        // Downstrokes sweep low→high string, upstrokes sweep high→low —
        // matches the physical direction the pick actually travels.
        const order = isDown ? STRING_FREQS : [...STRING_FREQS].reverse();
        const strumSpreadSec = 0.01; // time between each string being hit

        order.forEach((freq, idx) => {
            const startTime = now + idx * strumSpreadSec;

            const osc = ctx.createOscillator();
            osc.type = "sawtooth"; // richer harmonics than sine/triangle, closer to a plucked string
            osc.frequency.setValueAtTime(freq, startTime);
            osc.detune.setValueAtTime((Math.random() - 0.5) * 8, startTime); // slight per-string detune, avoids a "too clean" synth sound

            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(2200, startTime);
            filter.Q.setValueAtTime(0.6, startTime);

            const gain = ctx.createGain();
            const peak = isDown ? 0.16 : 0.11; // upstrokes read as quieter/lighter, like a real strum
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(peak, startTime + 0.003); // near-instant pluck attack
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35); // natural string decay

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });
    }, []);

    const stopPlayback = useCallback(() => {
        if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setPlaying(false);
    }, []);

    const startPlayback = () => {
        if (playing) {
            stopPlayback();
            return;
        }

        setPlaying(true);

        // Calculate 8th note duration in ms: (60,000 / BPM) / 2
        const eighthNoteMs = (60000 / bpm) / 2;
        let step = 0;

        timerRef.current = window.setInterval(() => {
            const currentSymbol = arrows[step % arrows.length];
            if (currentSymbol === "↓") {
                playStrumSound(true);
            } else if (currentSymbol === "↑") {
                playStrumSound(false);
            }

            step++;
        }, eighthNoteMs);
    };

    useEffect(() => {
        return () => stopPlayback();
    }, [stopPlayback]);

    return (
        <div
            style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12
            }}
        >
            <StrumPatternDisplay pattern={pattern} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>{bpm} BPM</span>
                <button
                    type="button"
                    onClick={startPlayback}
                    title={playing ? "Stop Strum Preview" : "Play Strum Preview"}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: "1px solid var(--accent, #f97316)",
                        background: playing ? "var(--accent, #f97316)" : "transparent",
                        color: playing ? "#000" : "var(--accent, #f97316)",
                        cursor: "pointer",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem"
                    }}
                >
                    {playing ? "❚❚" : "▶"}
                </button>
            </div>
        </div>
    );
}