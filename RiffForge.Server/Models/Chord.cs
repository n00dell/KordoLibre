using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RiffForge.Server.Models
{
    [Index(nameof(NormalizedName), IsUnique = true)]
    public class Chord
    {
        [Key]
        public int Id { get; set; }

        // e.g. "Am7", "G", "F#dim"
        [Required]
        [MaxLength(20)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string NormalizedName { get; set; } = string.Empty;
        [MaxLength(500)]
        public string? SourceUrl { get; set; }

        [MaxLength(100)]
        public string? SourceName { get; set; } // e.g. "UltimateGuitar", "MusicBrainz"

        public DateTime? LastScraped { get; set; }

        // Root note, e.g. "A", "F#"
        [MaxLength(5)]
        public string Root { get; set; } = string.Empty;

        public ChordQuality Quality { get; set; } // Major, Minor, Dominant7, Sus4, etc.

        public bool IsBarreChord { get; set; }

        public Difficulty Difficulty { get; set; }

        // Fret positions per string, low to high (e.g. "x02220" for Am)
        // Store per-tuning if you want to support alternate tunings later
        [MaxLength(20)]
        public string? FretPositions { get; set; }

        // Optional: which fingers go where, parallel to FretPositions
        [MaxLength(20)]
        public string? FingeringPattern { get; set; }

        public Tuning Tuning { get; set; } = Tuning.Standard;

        [Column(TypeName = "jsonb")]
        public string? DiagramJson { get; set; } // for rendering a chord chart on the frontend

        public ICollection<SongVersion> SongVersions { get; set; } = new List<SongVersion>();

    }
}
