using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RiffForge.Server.Models
{

    [Index(nameof(UserId), nameof(SongVersionId), IsUnique = true)]
    public class UserSongProgress
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(SongVersion))]
        public int SongVersionId { get; set; }
        public SongVersion SongVersion { get; set; } = null!;

        public bool IsCompleted { get; set; }
        public DateTime? DateCompleted { get; set; }

        public int PracticeCount { get; set; }
        public DateTime? LastPracticed { get; set; }

        [Range(0, 5)]
        public int? PersonalRating { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }
    }
}
