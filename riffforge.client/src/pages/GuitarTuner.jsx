import { useState, useRef, useEffect, useCallback } from "react";

// ---- Tuning presets -------------------------------------------------
const TUNINGS = {
    Standard: [
        { note: "E2", freq: 82.41 },
        { note: "A2", freq: 110.0 },
        { note: "D3", freq: 146.83 },
        { note: "G3", freq: 196.0 },
        { note: "B3", freq: 246.94 },
        { note: "E4", freq: 329.63 },
    ],
    DropD: [
        { note: "D2", freq: 73.42 },
        { note: "A2", freq: 110.0 },
        { note: "D3", freq: 146.83 },
        { note: "G3", freq: 196.0 },
        { note: "B3", freq: 246.94 },
        { note: "E4", freq: 329.63 },
    ],
    HalfStepDown: [
        { note: "Eb2", freq: 77.78 },
        { note: "Ab2", freq: 103.83 },
        { note: "Db3", freq: 138.59 },
        { note: "Gb3", freq: 185.0 },
        { note: "Bb3", freq: 233.08 },
        { note: "Eb4", freq: 311.13 },
    ],
    DropC: [
        { note: "C2", freq: 65.41 },
        { note: "G2", freq: 98.0 },
        { note: "C3", freq: 130.81 },
        { note: "F3", freq: 174.61 },
        { note: "A3", freq: 220.0 },
        { note: "D4", freq: 293.66 },
    ],
    OpenG: [
        { note: "D2", freq: 73.42 },
        { note: "G2", freq: 98.0 },
        { note: "D3", freq: 146.83 },
        { note: "G3", freq: 196.0 },
        { note: "B3", freq: 246.94 },
        { note: "D4", freq: 293.66 },
    ],
    DADGAD: [
        { note: "D2", freq: 73.42 },
        { note: "A2", freq: 110.0 },
        { note: "D3", freq: 146.83 },
        { note: "G3", freq: 196.0 },
        { note: "A3", freq: 220.0 },
        { note: "D4", freq: 293.66 },
    ],
};

const TUNING_LABELS = {
    Standard: "Standard (E A D G B E)",
    DropD: "Drop D (D A D G B E)",
    HalfStepDown: "Half step down",
    DropC: "Drop C (C G C F A D)",
    OpenG: "Open G (D G D G B D)",
    DADGAD: "DADGAD",
};

// ---- Optimized Pitch detection (autocorrelation) --------------------
function detectPitch(buf, sampleRate) {
    const SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.015) return -1; // Noise gate / quiet threshold

    let r1 = 0;
    let r2 = SIZE - 1;
    const threshold = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buf[i]) < threshold) {
            r1 = i;
            break;
        }
    }
    for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buf[SIZE - i]) < threshold) {
            r2 = SIZE - i;
            break;
        }
    }
    const trimmed = buf.slice(r1, r2);
    const n = trimmed.length;

    // Bounded lag range (~50 Hz to ~1000 Hz) to avoid CPU bottlenecks
    const minLag = Math.floor(sampleRate / 1000);
    const maxLag = Math.min(n - 1, Math.ceil(sampleRate / 50));

    const c = new Array(maxLag + 1).fill(0);
    for (let lag = minLag; lag <= maxLag; lag++) {
        for (let i = 0; i < n - lag; i++) {
            c[lag] += trimmed[i] * trimmed[i + lag];
        }
    }

    let d = minLag;
    while (d < maxLag && c[d] > c[d + 1]) d++;

    let maxVal = -1;
    let maxPos = -1;
    for (let i = d; i <= maxLag; i++) {
        if (c[i] > maxVal) {
            maxVal = c[i];
            maxPos = i;
        }
    }

    let T0 = maxPos;
    if (T0 <= 0 || T0 >= maxLag) return -1;

    // Parabolic interpolation around peak
    const x1 = c[T0 - 1] ?? c[T0];
    const x2 = c[T0];
    const x3 = c[T0 + 1] ?? c[T0];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
}

function freqToCents(freq, targetFreq) {
    return 1200 * Math.log2(freq / targetFreq);
}

function closestString(freq, strings) {
    let best = strings[0];
    let bestDiff = Infinity;
    for (const s of strings) {
        const diff = Math.abs(freqToCents(freq, s.freq));
        if (diff < bestDiff) {
            bestDiff = diff;
            best = s;
        }
    }
    return best;
}

// ---- Upgraded SVG Gauge Component -----------------------------------
function Gauge({ cents, inTune }) {
    const clamped = Math.max(-50, Math.min(50, cents ?? 0));
    const angle = (clamped / 50) * 80; // -80deg .. 80deg sweep
    const color = inTune ? "#22c55e" : Math.abs(clamped) < 15 ? "#eab308" : "#f97316";

    // Compute points for target sweet spot arc (-5 to +5 cents)
    const sweetStartRad = (((-5 / 50) * 80 - 90) * Math.PI) / 180;
    const sweetEndRad = (((5 / 50) * 80 - 90) * Math.PI) / 180;
    const sx1 = 100 + 85 * Math.cos(sweetStartRad);
    const sy1 = 100 + 85 * Math.sin(sweetStartRad);
    const sx2 = 100 + 85 * Math.cos(sweetEndRad);
    const sy2 = 100 + 85 * Math.sin(sweetEndRad);

    const ticks = [];
    for (let i = -50; i <= 50; i += 10) {
        const a = (i / 50) * 80;
        const rad = ((a - 90) * Math.PI) / 180;
        const r1 = 78,
            r2 = i === 0 ? 66 : i % 20 === 0 ? 70 : 74;
        const x1 = 100 + r1 * Math.cos(rad);
        const y1 = 100 + r1 * Math.sin(rad);
        const x2 = 100 + r2 * Math.cos(rad);
        const y2 = 100 + r2 * Math.sin(rad);
        ticks.push(
            <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i === 0 ? "#a1a1aa" : "#52525b"}
                strokeWidth={i === 0 ? 3 : 2}
            />
        );
    }

    const arcPoints = [];
    for (let i = -80; i <= 80; i += 4) {
        const rad = ((i - 90) * Math.PI) / 180;
        arcPoints.push(`${100 + 85 * Math.cos(rad)},${100 + 85 * Math.sin(rad)}`);
    }

    const needleRad = ((angle - 90) * Math.PI) / 180;
    const needleX = 100 + 70 * Math.cos(needleRad);
    const needleY = 100 + 70 * Math.sin(needleRad);

    return (
        <svg viewBox="0 0 200 120" style={{ width: "100%", maxWidth: 340 }}>
            {/* Background Arc */}
            <polyline
                points={arcPoints.join(" ")}
                fill="none"
                stroke="#27272a"
                strokeWidth="6"
                strokeLinecap="round"
            />
            {/* In-Tune Sweet Spot Highlight Arc */}
            <path
                d={`M ${sx1} ${sy1} A 85 85 0 0 1 ${sx2} ${sy2}`}
                fill="none"
                stroke="#22c55e"
                strokeWidth="6"
                strokeOpacity="0.8"
            />
            {ticks}
            {/* Dynamic Needle */}
            <line
                x1="100"
                y1="100"
                x2={needleX}
                y2={needleY}
                stroke={color}
                strokeWidth="3.5"
                strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="6" fill="#18181b" stroke="#a1a1aa" strokeWidth="2" />
        </svg>
    );
}

// ---- Main Component ---------------------------------------------------
export default function GuitarTuner({ initialTuning = "Standard" }) {
    const [tuningKey, setTuningKey] = useState(
        TUNINGS[initialTuning] ? initialTuning : "Standard"
    );
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [autoDetect, setAutoDetect] = useState(true);
    const [listening, setListening] = useState(false);
    const [error, setError] = useState(null);
    const [freq, setFreq] = useState(null);
    const [note, setNote] = useState(null);
    const [cents, setCents] = useState(0);
    const [calibration, setCalibration] = useState(0);

    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const rafRef = useRef(null);
    const streamRef = useRef(null);

    // Exponential smoothing ref for jitter-free needle transitions
    const smoothedCentsRef = useRef(0);

    // Ref container holding current config values to prevent stale closures inside tick()
    const liveConfigRef = useRef({ tuningKey, selectedIdx, autoDetect, calibration });
    useEffect(() => {
        liveConfigRef.current = { tuningKey, selectedIdx, autoDetect, calibration };
    }, [tuningKey, selectedIdx, autoDetect, calibration]);

    const strings = TUNINGS[tuningKey];
    const target = strings[selectedIdx] || strings[0];

    const stopListening = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        if (audioCtxRef.current) audioCtxRef.current.close();
        audioCtxRef.current = null;
        analyserRef.current = null;
        streamRef.current = null;
        setListening(false);
        setFreq(null);
        setNote(null);
        setCents(0);
        smoothedCentsRef.current = 0;
    }, []);

    const startListening = useCallback(async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            audioCtxRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            analyserRef.current = analyser;

            const buf = new Float32Array(analyser.fftSize);

            const tick = () => {
                analyser.getFloatTimeDomainData(buf);
                const detected = detectPitch(buf, ctx.sampleRate);

                if (detected !== -1 && detected > 50 && detected < 1000) {
                    const {
                        tuningKey: curKey,
                        autoDetect: curAuto,
                        selectedIdx: curIdx,
                        calibration: curCal,
                    } = liveConfigRef.current;

                    const activeStrings = TUNINGS[curKey] || TUNINGS.Standard;
                    const activeTarget = curAuto
                        ? closestString(detected, activeStrings)
                        : activeStrings[curIdx] || activeStrings[0];

                    if (curAuto) {
                        const idx = activeStrings.indexOf(activeTarget);
                        setSelectedIdx(idx);
                    }

                    const rawCents = freqToCents(detected, activeTarget.freq + curCal);

                    // Apply exponential moving average smoothing (alpha = 0.25)
                    const smoothedCents = smoothedCentsRef.current * 0.75 + rawCents * 0.25;
                    smoothedCentsRef.current = smoothedCents;

                    setFreq(detected);
                    setNote(activeTarget.note);
                    setCents(smoothedCents);
                }

                rafRef.current = requestAnimationFrame(tick);
            };

            tick();
            setListening(true);
        } catch (e) {
            setError("Microphone access denied or unavailable. Allow mic permission and try again.");
        }
    }, []);

    useEffect(() => stopListening, [stopListening]);

    const inTune = freq !== null && Math.abs(cents) < 5;

    return (
        <div
            style={{
                background: "#0a0a0c",
                color: "#e4e4e7",
                borderRadius: 16,
                padding: "28px 24px",
                maxWidth: 420,
                fontFamily: "system-ui, sans-serif",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
        >
            {/* Gauge Header */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <Gauge cents={freq ? cents : 0} inTune={inTune} />
            </div>

            {/* Primary Pitch Readout */}
            <div style={{ textAlign: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.5px" }}>
                    {note ?? target.note}
                </div>
                <div style={{ fontSize: 13, color: "#a1a1aa" }}>
                    {(target.freq + calibration).toFixed(2)} Hz target
                </div>
            </div>

            {/* Tuning Guidance Status */}
            <div
                style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: 700,
                    height: 26,
                    marginBottom: 20,
                    color: !freq ? "#71717a" : inTune ? "#22c55e" : "#f97316",
                }}
            >
                {!freq ? "PLAY A STRING" : inTune ? "IN TUNE!" : cents > 0 ? "TUNE DOWN" : "TUNE UP"}
            </div>

            {/* Real-time Telemetry Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    textAlign: "center",
                    marginBottom: 24,
                    fontSize: 13,
                    background: "#121215",
                    padding: "12px 8px",
                    borderRadius: 10,
                    border: "1px solid #27272a",
                }}
            >
                <div>
                    <div style={{ color: "#a1a1aa", fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>NOTE</div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{note ?? "--"}</div>
                </div>
                <div>
                    <div style={{ color: "#a1a1aa", fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>FREQ</div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{freq ? `${freq.toFixed(1)} Hz` : "--"}</div>
                </div>
                <div>
                    <div style={{ color: "#a1a1aa", fontSize: 11, letterSpacing: 1, marginBottom: 2 }}>OFFSET</div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{freq ? `${cents.toFixed(0)} ct` : "--"}</div>
                </div>
            </div>

            {/* Preset Selector */}
            <label style={{ fontSize: 13, color: "#a1a1aa", display: "block", marginBottom: 6 }}>
                Tuning preset
            </label>
            <select
                value={tuningKey}
                onChange={(e) => {
                    setTuningKey(e.target.value);
                    setSelectedIdx(0);
                }}
                style={{
                    width: "100%",
                    background: "#18181b",
                    color: "#e4e4e7",
                    border: "1px solid #3f3f46",
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 20,
                    fontSize: 14,
                    outline: "none",
                }}
            >
                {Object.keys(TUNINGS).map((k) => (
                    <option key={k} value={k}>
                        {TUNING_LABELS[k]}
                    </option>
                ))}
            </select>

            {/* Interactive String Selector Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 13, color: "#a1a1aa" }}>Select String</label>
                <label style={{ fontSize: 12, color: "#a1a1aa", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={autoDetect}
                        onChange={(e) => setAutoDetect(e.target.checked)}
                    />
                    Auto-detect
                </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 20 }}>
                {strings.map((s, i) => {
                    const isSelected = selectedIdx === i;
                    return (
                        <button
                            key={s.note}
                            disabled={autoDetect}
                            onClick={() => setSelectedIdx(i)}
                            style={{
                                padding: "8px 2px",
                                borderRadius: 8,
                                border: isSelected ? "2px solid #22c55e" : "1px solid #3f3f46",
                                background: isSelected ? "#14532d" : "#18181b",
                                color: autoDetect ? (isSelected ? "#e4e4e7" : "#71717a") : "#e4e4e7",
                                fontWeight: isSelected ? 700 : 500,
                                cursor: autoDetect ? "default" : "pointer",
                                transition: "all 0.15s ease",
                            }}
                        >
                            <div style={{ fontSize: 13 }}>{s.note}</div>
                            <div style={{ fontSize: 10, opacity: 0.7 }}>{s.freq.toFixed(0)}Hz</div>
                        </button>
                    );
                })}
            </div>

            {/* Calibration Controls */}
            <label style={{ fontSize: 13, color: "#a1a1aa", display: "block", marginBottom: 6 }}>
                Calibration offset ({calibration >= 0 ? "+" : ""}
                {calibration} Hz)
            </label>
            <input
                type="range"
                min={-10}
                max={10}
                step={0.5}
                value={calibration}
                onChange={(e) => setCalibration(Number(e.target.value))}
                style={{ width: "100%", marginBottom: 24, accentColor: "#22c55e" }}
            />

            {error && (
                <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12, textAlign: "center" }}>
                    {error}
                </div>
            )}

            {/* Main Action Button */}
            <button
                onClick={listening ? stopListening : startListening}
                style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: listening ? "#3f3f46" : "#22c55e",
                    color: listening ? "#e4e4e7" : "#052e12",
                    transition: "background 0.2s ease",
                }}
            >
                {listening ? "Stop tuning" : "Start tuning"}
            </button>
        </div>
    );
}