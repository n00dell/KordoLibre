using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Models.LastFm;
using RiffForge.Server.Services.Interfaces;

namespace RiffForge.Server.Controllers
{
    [Route("api/songsearch")]
    [ApiController]
    public class SongSearchController : ControllerBase
    {
        private readonly ILastFmService _lastFm;
        private readonly ILyricsService _lyrics;
        private readonly RiffForgeDbContext _db; // however your DbContext is named

        public SongSearchController(ILastFmService lastFm, ILyricsService lyrics,RiffForgeDbContext db)
        {
            _lastFm = lastFm;
            _db = db;
            _lyrics = lyrics;
        }

        [HttpGet]
        public async Task<ActionResult<List<LastFmTrackSummary>>> Search(
            [FromQuery] string query, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                return Ok(new List<LastFmTrackSummary>());

            var results = await _lastFm.SearchTracksAsync(query, ct);
            return Ok(results);
        }
        public record ImportRequest(string Artist, string Track);

        // POST /api/songsearch/import  { artist, track }
        // Fires when the user taps a search result. This is the hinge point:
        // Last.fm gave us confirmation the song exists; now we create local
        // records and hand off to the scraper for chords/tab.
        [HttpPost("import")]
        public async Task<ActionResult<ScrapeRequest>> Import(
            [FromBody] ImportRequest req, CancellationToken ct)
        {
            var cleanArtist = CleanInput(req.Artist);
            var cleanTrack = CleanInput(req.Track);
            var normArtist = Normalize(cleanArtist);
            var normTrack = Normalize(cleanTrack);

            // ==========================================
            // 1. CHECK DB FIRST (Prevents Duplicates)
            // ==========================================
            var existingSong = await _db.Songs
                .Include(s => s.PrimaryArtist)
                .FirstOrDefaultAsync(s =>
                    s.NormalizedName == normTrack &&
                    s.PrimaryArtist.NormalizedName == normArtist, ct);

            if (existingSong != null)
            {
                // Song already in DB - complete request instantly!
                var completedReq = new ScrapeRequest
                {
                    Query = $"{existingSong.PrimaryArtist.Name} - {existingSong.Name}",
                    Status = ScrapeStatus.Completed,
                    ResultSongId = existingSong.Id,
                    RequestedAt = DateTime.UtcNow,
                    CompletedAt = DateTime.UtcNow
                };
                _db.ScrapeRequests.Add(completedReq);
                await _db.SaveChangesAsync(ct);

                return Ok(completedReq);
            }

            // ==========================================
            // 2. NOT IN DB -> Fetch from Last.fm
            // ==========================================
            var detail = await _lastFm.GetTrackInfoAsync(cleanArtist, cleanTrack, ct);
            if (detail is null) return NotFound("Track not found on Last.fm.");

            var finalArtistName = CleanInput(detail.Artist);
            var finalTrackName = CleanInput(detail.Name);
            var finalNormArtist = Normalize(finalArtistName);
            var finalNormTrack = Normalize(finalTrackName);

            // Re-check DB in case Last.fm corrected spelling/casing
            existingSong = await _db.Songs
                .Include(s => s.PrimaryArtist)
                .FirstOrDefaultAsync(s =>
                    s.NormalizedName == finalNormTrack &&
                    s.PrimaryArtist.NormalizedName == finalNormArtist, ct);

            if (existingSong != null)
            {
                var completedReq = new ScrapeRequest
                {
                    Query = $"{existingSong.PrimaryArtist.Name} - {existingSong.Name}",
                    Status = ScrapeStatus.Completed,
                    ResultSongId = existingSong.Id,
                    RequestedAt = DateTime.UtcNow,
                    CompletedAt = DateTime.UtcNow
                };
                _db.ScrapeRequests.Add(completedReq);
                await _db.SaveChangesAsync(ct);

                return Ok(completedReq);
            }

            // ==========================================
            // 3. FETCH LYRICS & CREATE NEW RECORDS
            // ==========================================
            string? lyricsText = null;
            try
            {
                lyricsText = await _lyrics.GetLyricsAsync(finalArtistName, finalTrackName, ct);
            }
            catch
            {
                // Fallback handled safely
            }

            // Find or Create Artist
            var artist = await _db.Artists
                .FirstOrDefaultAsync(a => a.NormalizedName == finalNormArtist, ct);

            if (artist == null)
            {
                artist = new Artist
                {
                    Name = finalArtistName,
                    NormalizedName = finalNormArtist,
                    ImageUrl = detail.ImageUrl
                };
                _db.Artists.Add(artist);
                await _db.SaveChangesAsync(ct);
            }

            // Create Song
            var song = new Song
            {
                Name = finalTrackName,
                NormalizedName = finalNormTrack,
                PrimaryArtistId = artist.Id,
                AlbumArtUrl = detail.ImageUrl,
                Lyrics = lyricsText,
                BPM = 120,
                ReleaseDate = DateTime.UtcNow
            };
            _db.Songs.Add(song);
            await _db.SaveChangesAsync(ct);

            // Create Default Version with Lyrics
            var version = new SongVersion
            {
                SongId = song.Id,
                Difficulty = Difficulty.Intermediate,
                Tuning = Tuning.Standard,
                CapoPos = CapoPos.None,
                StrumPattern = StrumPattern.DownDownUp,
                IsDefault = true,
                TabData = lyricsText ?? string.Empty
            };
            _db.SongVersions.Add(version);

            // Create ScrapeRequest
            var scrapeRequest = new ScrapeRequest
            {
                Query = $"{finalArtistName} - {finalTrackName}",
                Status = ScrapeStatus.Completed,
                ResultSongId = song.Id,
                RequestedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow
            };
            _db.ScrapeRequests.Add(scrapeRequest);
            await _db.SaveChangesAsync(ct);

            return Ok(scrapeRequest);
        }

        private static string CleanInput(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;

            // Take the part before bullet points or extra metadata delimiters
            var cleaned = input.Split('•')[0].Trim();
            return cleaned;
        }

        // Standardizes string for database unique indexes
        private static string Normalize(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            return input.Trim().ToLowerInvariant();
        }
        // GET /api/songsearch/status/5 — the frontend polls this while scraping runs
        [HttpGet("status/{id}")]
        public async Task<ActionResult<ScrapeRequest>> Status(int id)
        {
            var req = await _db.ScrapeRequests.FindAsync(id);
            return req is null ? NotFound() : Ok(req);
        }
    }
}
