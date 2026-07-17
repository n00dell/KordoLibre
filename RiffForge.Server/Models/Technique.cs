using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace RiffForge.Server.Models
{
    [Index(nameof(NormalizedName), IsUnique = true)]
    public class Technique
    {
        [Key]
        public int Id { get; set; }

        // e.g. "Hammer-on", "Palm Mute", "Bend", "Tapping"
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string NormalizedName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public Difficulty Difficulty { get; set; }

        public TechniqueCategory Category { get; set; } // Fretting, Picking, Rhythm, etc.

        [MaxLength(500)]
        public string? SourceUrl { get; set; }

        [MaxLength(100)]
        public string? SourceName { get; set; }

        public DateTime? LastScraped { get; set; }

        public ICollection<SongVersion> SongVersions { get; set; } = new List<SongVersion>();

    }
}
