import VinylCard from '../components/VinylCard';

// Define the Song type (matches your C# model eventually)
interface Song {
    id: number;
    title: string;
    artist: string;
    coverGradient?: string;
    labelGradient?: string;
}

// Sample data typed as Song[]
const sampleSongs: Song[] = [
    {
        id: 1,
        title: "Wonderwall",
        artist: "Oasis",
        coverGradient: "linear-gradient(135deg, #1e3c72, #2a5298)",
        labelGradient: "radial-gradient(circle, #f7f7f7, #d4d4d4)"
    },
    {
        id: 2,
        title: "Stairway",
        artist: "Zeppelin",
        coverGradient: "linear-gradient(135deg, #3a1c33, #1a0f1a)",
        labelGradient: "radial-gradient(circle, #ffd700, #b8860b)"
    },
    {
        id: 3,
        title: "Johnny B. Goode",
        artist: "Berry",
        coverGradient: "linear-gradient(135deg, #c31432, #240b36)",
        labelGradient: "radial-gradient(circle, #ff6b6b, #c0392b)"
    },
    {
        id: 4,
        title: "Blackbird",
        artist: "Beatles",
        coverGradient: "linear-gradient(135deg, #2c3e50, #000000)",
        labelGradient: "radial-gradient(circle, #a8e6cf, #55efc4)"
    },
];

function LibraryPage() {
    return (
        <div className="library-page">
            <h1>Your Vinyl Collection</h1>
            <div className="vinyl-grid">
                {sampleSongs.map((song) => (
                    <VinylCard
                        key={song.id}
                        title={song.title}
                        artist={song.artist}
                        coverGradient={song.coverGradient}
                        labelGradient={song.labelGradient}
                    />
                ))}
            </div>
        </div>
    );
}

export default LibraryPage;