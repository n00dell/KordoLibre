using RiffForge.Server.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;


namespace RiffForge.Server.Models
{
    [Index(nameof(NormalizedName))]
    public class Song
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string NormalizedName { get; set; } = string.Empty;

        [ForeignKey(nameof(PrimaryArtist))]
        public int PrimaryArtistId { get; set; }

        [MaxLength(500)]
        public string? AlbumArtUrl { get; set; }
        public Artist PrimaryArtist { get; set; } = null!;

        public string? Lyrics { get; set; }

        public ICollection<Artist> FeaturedArtists { get; set; } = new List<Artist>();

        public int BPM { get; set; }

        public DateTime ReleaseDate { get; set; }

        public InstrumentType InstrumentType { get; set; }

        public DateTime DateAdded { get; set; } = DateTime.UtcNow;

        public ICollection<Genre> Genres { get; set; } = new List<Genre>();

        public ICollection<SongVersion> Versions { get; set; } = new List<SongVersion>();

        [NotMapped]
        public string FullDisplayName => $"{Name} - {PrimaryArtist?.Name ?? "Unknown"}";

        [NotMapped]
        public SongVersion? DefaultVersion => Versions?.FirstOrDefault(v => v.IsDefault);

    }
    
}
