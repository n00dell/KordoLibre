using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using RiffForge.Server.Models.DTOs;

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

        [MaxLength(16)]
        public string StrumPattern { get; set; } = "D-D-D-D-";
        public Tuning Tuning { get; set; }
        public CapoPos CapoPos { get; set; }
        public Difficulty Difficulty { get; set; }

        [Range(0, 5)]
        public decimal Rating { get; set; } 

        public int RatingCount { get; set; } 

        public bool IsDefault { get; set; }

        [MaxLength(100)]
        public string? ContributorName { get; set; } 
        
        public bool IsUserSubmission { get; set; }
        
        public string? ContributorUserId { get; set; }
        
        [MaxLength(500)]
        public string? SourceUrl { get; set; }

        [MaxLength(100)]
        public string? SourceName { get; set; }

        public NotationType NotationType { get; set; }
        public DateTime DateScraped { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public ICollection<SongVersionChordShape> ChordShapes { get; set; } = new List<SongVersionChordShape>();

        // Flattened Chord + ChordShape view, same shape the frontend already
        // expects (fretPositions/isBarreChord sitting directly on the chord).
        [NotMapped]
        public List<ResolvedChordDto> Chords => ChordShapes
            .OrderBy(cs => cs.SortOrder)
            .Select(cs => new ResolvedChordDto
            {
                Id = cs.ChordShape.ChordId,
                ShapeId = cs.ChordShape.Id,
                Name = cs.ChordShape.Chord.Name,
                Root = cs.ChordShape.Chord.Root,
                Quality = cs.ChordShape.Chord.Quality,
                Tuning = cs.ChordShape.Chord.Tuning,
                Difficulty = cs.ChordShape.Difficulty,
                FretPositions = cs.ChordShape.FretPositions,
                IsBarreChord = cs.ChordShape.IsBarreChord,
                FingeringPattern = cs.ChordShape.FingeringPattern,
            })
            .ToList();
        public ICollection<Technique> Techniques { get; set; } = new List<Technique>();
    }
}
