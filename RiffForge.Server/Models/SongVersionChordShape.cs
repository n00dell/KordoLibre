using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace RiffForge.Server.Models;

public class SongVersionChordShape
{
    [Key]
    public int Id { get; set; }

    [ForeignKey(nameof(SongVersion))]
    public int SongVersionId { get; set; }
    [JsonIgnore]
    public SongVersion SongVersion { get; set; } = null!;

    [ForeignKey(nameof(ChordShape))]
    public int ChordShapeId { get; set; }
    public ChordShape ChordShape { get; set; } = null!;

    public int SortOrder { get; set; }
}