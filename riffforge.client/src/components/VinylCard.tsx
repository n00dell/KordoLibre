// Define the shape of the data this component expects
interface VinylCardProps {
    title: string;
    artist: string;
    coverGradient?: string;       // Optional, with a default fallback
    labelGradient?: string;       // Optional
}

function VinylCard({ title, artist, coverGradient, labelGradient }: VinylCardProps) {
    // Fallback gradients if not provided
    const cover = coverGradient || 'linear-gradient(135deg, #2a1e3c, #1a1a2e)';
    const label = labelGradient || 'radial-gradient(circle, #ff416c, #ff4b2b)';

    return (
        <div className="vinyl-card">
            {/* Album Cover (Background) */}
            <div className="album-cover" style={{ background: cover }}>
                <div className="cover-text">{title}</div>
            </div>

            {/* Vinyl Disc (Slides out) */}
            <div className="vinyl-disc">
                {/* Center Label with its own art */}
                <div className="center-label" style={{ background: label }}>
                    <span className="center-title">{title}</span>
                    <span className="center-artist">{artist}</span>
                </div>
            </div>
        </div>
    );
}

export default VinylCard;