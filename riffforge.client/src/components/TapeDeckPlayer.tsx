import { useState, useEffect } from "react";
import type { Song } from "../types/models";
import useDominantColor from "../hooks/useDominantColor";
import { tapeColorForGenre } from "../utils/tapeColors";

interface TapeDeckPlayerProps {
    song: Song;
}

function TapeDeckPlayer({ song }: TapeDeckPlayerProps) {
    const fallbackColor = tapeColorForGenre(song.genres?.[0]?.name, song.id);
    const shellColor = useDominantColor(song.albumArtUrl, fallbackColor);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsPlaying(true), 500);
        return () => clearTimeout(timer);
    }, []);

   
    return (
        <div className="tape-deck-view" style={{ "--shell-color": shellColor } as React.CSSProperties}>
            <div className="album-backdrop">
                <div className="album-backdrop-image" style={{ background: shellColor }} />
                <div className="album-backdrop-scrim" />
            </div>

            <div className={`tape-deck-housing ${isPlaying ? "playing" : ""}`}>
                <div className="tape-bay">
                    <div className="tape-door" />
                    <div className="tape-deck-cassette">
                        <div className="tape-window">
                            <div className={`tape-deck-reel ${isPlaying ? "spinning" : ""}`} />
                            <div className={`tape-deck-reel ${isPlaying ? "spinning" : ""}`} />
                        </div>
                        <div className="tape-deck-label">
                            <div className="label-title">{song.name}</div>
                            <div className="label-artist">{song.primaryArtist?.name ?? "Unknown"}</div>
                        </div>
                    </div>
                </div>

                <div className="tape-transport">
                    <div className="tape-buttons">
                        <div className={`tape-button ${isPlaying ? "playing" : ""}`} />
                        <div className="tape-button" />
                        <div className="tape-button" />
                    </div>
                    <div className="tape-vu">
                        <div className="tape-vu-led" />
                        <div className="tape-vu-led" />
                        <div className="tape-vu-led" />
                        <div className="tape-vu-led" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TapeDeckPlayer;