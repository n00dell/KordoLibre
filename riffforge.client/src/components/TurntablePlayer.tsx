import { useState, useEffect } from "react";
import type { Song } from "../types/models";

interface TurntablePlayerProps {
    song: Song;
}

function TurntablePlayer({ song }: TurntablePlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    // Trigger the needle-drop animation shortly after mount, so the record
    // visibly "arrives" before the arm swings onto it.
    useEffect(() => {
        const timer = setTimeout(() => setIsPlaying(true), 400);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="turntable-view-container">
            {/* Ambient backdrop — blurred album art, purely atmospheric */}
            <div className="album-backdrop">
                <div
                    className="album-backdrop-image"
                    style={{
                        backgroundImage: song.albumArtUrl ? `url(${song.albumArtUrl})` : undefined,
                    }}
                />
                <div className="album-backdrop-scrim" />
            </div>

            {/* The actual player — foreground hero content */}
            <div className={`turntable-deck ${isPlaying ? "playing" : ""}`}>
                <div className="tone-arm" />
                <div className="turntable-record">
                    <div className="vinyl-shine" />
                    <div
                        className="turntable-label"
                        style={{
                            backgroundImage: song.albumArtUrl ? `url(${song.albumArtUrl})` : undefined,
                            backgroundColor: "#ff7a00",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default TurntablePlayer;