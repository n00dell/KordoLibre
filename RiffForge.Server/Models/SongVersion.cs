using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace RiffForge.Server.Models
{
    [Index(nameof(SongId), nameof(IsDefault))]
    public class SongVersion
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey(nameof(Song))]
        public int SongId { get; set; }
        [JsonIgnore]
        public Song Song { get; set; } = null!;

        [MaxLength(10000)]
        public string? TabData { get; set; } = string.Empty;

        [Column(TypeName = "jsonb")]
        public string? StructuredTabJson { get; set; }

        public StrumPattern StrumPattern { get; set; }
        public Tuning Tuning { get; set; }
        public CapoPos CapoPos { get; set; }
        public Difficulty Difficulty { get; set; }

        [Range(0, 5)]
        public decimal Rating { get; set; } // rating for THIS version, not the song overall

        public int RatingCount { get; set; } // how many people rated it, for a weighted "best version" sort

        public bool IsDefault { get; set; } // which version shows first when the song loads

        [MaxLength(100)]
        public string? ContributorName { get; set; } // whoever posted it on the source site

        [MaxLength(500)]
        public string? SourceUrl { get; set; }

        [MaxLength(100)]
        public string? SourceName { get; set; }

        public NotationType NotationType { get; set; }
        public DateTime DateScraped { get; set; } = DateTime.UtcNow;

        public ICollection<Chord> Chords { get; set; } = new List<Chord>();
        public ICollection<Technique> Techniques { get; set; } = new List<Technique>();
    }
}
