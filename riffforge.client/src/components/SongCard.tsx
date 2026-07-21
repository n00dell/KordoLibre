// components/SongCard.tsx
import type { Song } from "../types/models";
import { useTheme } from "../context/ThemeContext";
import VinylCard from "./VinylCard";
import CassetteCard from "./CassetteCard";

interface SongCardProps {
    song: Song;
    onClick?: (song: Song) => void;
    progress?: number;
}

function SongCard({ song, onClick, progress }: SongCardProps) {
    const { theme } = useTheme();

    if (theme === "cassette") {
        return <CassetteCard song={song} onClick={onClick} progress={progress} />;
    }

    return <VinylCard song={song} onClick={onClick} />;
}

export default SongCard;