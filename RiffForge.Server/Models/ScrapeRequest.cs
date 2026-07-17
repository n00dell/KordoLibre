using RiffForge.Server.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace RiffForge.Server.Models
{
    public class ScrapeRequest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Query { get; set; } = string.Empty; // what the user searched

        public ScrapeStatus Status { get; set; } = ScrapeStatus.Pending;

        public int? ResultSongId { get; set; }
        public Song? ResultSong { get; set; }

        [MaxLength(1000)]
        public string? ErrorMessage { get; set; }

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }
}
