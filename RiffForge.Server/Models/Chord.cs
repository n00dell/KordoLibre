using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace RiffForge.Server.Models
{
    [Index(nameof(NormalizedName), IsUnique = true)]
    public class Chord
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(20)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string NormalizedName { get; set; } = string.Empty;

        [MaxLength(5)]
        public string Root { get; set; } = string.Empty;

        public ChordQuality Quality { get; set; }

        public Tuning Tuning { get; set; } = Tuning.Standard;

        // Which shape renders when nobody's picked a specific variation.
        public int? DefaultShapeId { get; set; }
        [ForeignKey(nameof(DefaultShapeId))]
        public ChordShape? DefaultShape { get; set; }

        public ICollection<ChordShape> Shapes { get; set; } = new List<ChordShape>();

        [JsonIgnore]
        public ICollection<SongVersion> SongVersions { get; set; } = new List<SongVersion>();
        
        
    }
}
