using RiffForge.Server.Models.Enums;

namespace RiffForge.Server.Models.DTOs;

public class ResolvedChordDto
{
    public int Id { get; set; }       // Chord.Id — identity
    public int ShapeId { get; set; }  // ChordShape.Id — which voicing this version uses
    public string Name { get; set; } = string.Empty;
    public string Root { get; set; } = string.Empty;
    public ChordQuality Quality { get; set; }
    public Tuning Tuning { get; set; }
    public Difficulty Difficulty { get; set; }
    public string FretPositions { get; set; } = string.Empty;
    public bool IsBarreChord { get; set; }
    public string? FingeringPattern { get; set; }
    
    
}