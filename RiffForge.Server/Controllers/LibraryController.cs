using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models;
using System.Security.Claims;

namespace RiffForge.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LibraryController : ControllerBase
    {
        private readonly RiffForgeDbContext _db;
        public LibraryController(RiffForgeDbContext db)
        {
            _db = db;
        }
        [HttpGet]
        public async Task<ActionResult<List<Song>>> GetLibrary(CancellationToken ct)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var profile = await _db.UserProfiles
                .Include(p => p.LibrarySongs).ThenInclude(s => s.PrimaryArtist)
                .Include(p => p.LibrarySongs).ThenInclude(s => s.Versions)
                .FirstOrDefaultAsync(p => p.UserId == userId, ct);

            return Ok(profile?.LibrarySongs.ToList() ?? new List<Song>());
        }
        // GET /api/library/status?songIds=1,2,3 — which of these are already saved,
        // so a grid can light up the right stars on load instead of assuming "not saved"
        [HttpGet("status")]
        public async Task<ActionResult<List<int>>> GetStatus([FromQuery] string songIds, CancellationToken ct)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var ids = (songIds ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s, out var n) ? n : (int?)null)
                .Where(n => n.HasValue)
                .Select(n => n!.Value)
                .ToList();

            if (ids.Count == 0) return Ok(new List<int>());

            var savedIds = await _db.UserProfiles
                .Where(p => p.UserId == userId)
                .SelectMany(p => p.LibrarySongs)
                .Where(s => ids.Contains(s.Id))
                .Select(s => s.Id)
                .ToListAsync(ct);

            return Ok(savedIds);
        }

        // POST /api/library/{songId}
        [HttpPost("{songId:int}")]
        public async Task<IActionResult> Add(int songId, CancellationToken ct)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var song = await _db.Songs.FindAsync(new object?[] { songId }, ct);
            if (song is null) return NotFound("Song not found.");

            var profile = await GetOrCreateProfile(userId, ct);

            var alreadyIn = await _db.Entry(profile)
                .Collection(p => p.LibrarySongs)
                .Query()
                .AnyAsync(s => s.Id == songId, ct);

            if (!alreadyIn)
            {
                profile.LibrarySongs.Add(song);
                await _db.SaveChangesAsync(ct);
            }

            return Ok();
        }

        // DELETE /api/library/{songId}
        [HttpDelete("{songId:int}")]
        public async Task<IActionResult> Remove(int songId, CancellationToken ct)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var profile = await _db.UserProfiles
                .Include(p => p.LibrarySongs)
                .FirstOrDefaultAsync(p => p.UserId == userId, ct);

            if (profile is null) return Ok();

            var song = profile.LibrarySongs.FirstOrDefault(s => s.Id == songId);
            if (song != null)
            {
                profile.LibrarySongs.Remove(song);
                await _db.SaveChangesAsync(ct);
            }

            return Ok();
        }

        private async Task<UserProfile> GetOrCreateProfile(string userId, CancellationToken ct)
        {
            var profile = await _db.UserProfiles
                .Include(p => p.LibrarySongs)
                .FirstOrDefaultAsync(p => p.UserId == userId, ct);

            if (profile is null)
            {
                profile = new UserProfile { UserId = userId };
                _db.UserProfiles.Add(profile);
                await _db.SaveChangesAsync(ct);
            }

            return profile;
        }

        private string? GetUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.Identity?.Name;
    }
}

