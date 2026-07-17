using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace RiffForge.Server.Models
{
    [Index(nameof(NormalizedName), IsUnique = true)]
    public class Artist
    {

        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Bio { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        [Required]
        [MaxLength(100)]
        public string NormalizedName { get; set; } = string.Empty;
        [MaxLength(500)]
        public string? SourceUrl { get; set; }

        [MaxLength(100)]
        public string? SourceName { get; set; } // e.g. "UltimateGuitar", "MusicBrainz"

        public DateTime? LastScraped { get; set; }

        public ICollection<Song> Songs { get; set; } = new List<Song>();
    }
}
