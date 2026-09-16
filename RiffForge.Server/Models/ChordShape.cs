using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using RiffForge.Server.Models.Enums;

namespace RiffForge.Server.Models;

public class ChordShape
{
    [Key]
    public int Id { get; set; }

    [ForeignKey(nameof(Chord))]
    public int ChordId { get; set; }
    [JsonIgnore]
    public Chord Chord { get; set; } = null!;

    [Required, MaxLength(20)]
    public string FretPositions { get; set; } = string.Empty; // e.g. "x32000"

    [MaxLength(20)]
    public string? FingeringPattern { get; set; }

    public bool IsBarreChord { get; set; }

    public Difficulty Difficulty { get; set; }

    // null = seeded/canonical shape, not attributed to a specific user
    public string? ContributorUserId { get; set; }
    [MaxLength(100)]
    public string? ContributorName { get; set; }

    public int UpvoteCount { get; set; }
    public DateTime DateAdded { get; set; } = DateTime.UtcNow;
}