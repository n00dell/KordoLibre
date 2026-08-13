using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models;
using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Models.LastFm;
using RiffForge.Server.Services;
using RiffForge.Server.Services.Exceptions;
using RiffForge.Server.Services.Interfaces;

namespace RiffForge.Server.Controllers
{
    [Route("api/songsearch")]
    [Authorize]
    [ApiController]
    public class SongSearchController : ControllerBase
    {
        private readonly ILastFmService _lastFm;
        private readonly ILyricsService _lyrics;
        private readonly RiffForgeDbContext _db;
        private readonly IChordProviderFactory _chordFactory;
        private readonly IChordResolverService _chordResolver;
        private readonly ILogger<SongSearchController> _logger;
        private readonly AiProviderResolver _aiProviderResolver;

        public SongSearchController(ILastFmService lastFm, ILyricsService lyrics,RiffForgeDbContext db, IChordProviderFactory chordFactory, ILogger<SongSearchController> logger, AiProviderResolver aiProviderResolver, IChordResolverService chordResolver)
        {
            _lastFm = lastFm;
            _db = db;
            _lyrics = lyrics;
            _chordFactory = chordFactory;
            _chordResolver = chordResolver;
            _aiProviderResolver = aiProviderResolver;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<SongSearchResponse>> Search(
    [FromQuery] string query, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                return Ok(new SongSearchResponse());

            var normQuery = _chordResolver.Normalize(query);
            const double searchThreshold = 0.3;

            // Typo-tolerant title/artist matches
            var titleMatches = await _db.Songs
                .Include(s => s.PrimaryArtist)
                .Where(s =>
                    EF.Functions.TrigramsSimilarity(s.NormalizedName, normQuery) > searchThreshold ||
                    EF.Functions.TrigramsSimilarity(s.PrimaryArtist.NormalizedName, normQuery) > searchThreshold)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    ArtistName = s.PrimaryArtist.Name,
                    s.AlbumArtUrl,
                    Score = EF.Functions.TrigramsSimilarity(s.NormalizedName, normQuery) >
                            EF.Functions.TrigramsSimilarity(s.PrimaryArtist.NormalizedName, normQuery)
                        ? EF.Functions.TrigramsSimilarity(s.NormalizedName, normQuery)
                        : EF.Functions.TrigramsSimilarity(s.PrimaryArtist.NormalizedName, normQuery)
                })
                .ToListAsync(ct);
            var escaped = query.Replace("%", "\\%").Replace("_", "\\_");

            // Lyric substring matches — a lyric hit is a strong, unambiguous signal,
            // so it's ranked above fuzzy title matches when both exist.
            var lyricMatches = await _db.Songs
                .Include(s => s.PrimaryArtist)
                .Where(s => s.Lyrics != null && EF.Functions.ILike(s.Lyrics, $"%{escaped}%"))
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    ArtistName = s.PrimaryArtist.Name,
                    s.AlbumArtUrl,
                    Score = 1.0
                })
                .ToListAsync(ct);

            var localMatches = titleMatches.Concat(lyricMatches)
                .GroupBy(s => s.Id)
                .Select(g => g.OrderByDescending(s => s.Score).First()) // same song via both paths → keep the higher score
                .OrderByDescending(s => s.Score)
                .Take(15)
                .Select(s => new LocalSongMatch(s.Id, s.Name, s.ArtistName, s.AlbumArtUrl))
                .ToList();

            var externalResults = await _lastFm.SearchTracksAsync(query, ct);

            return Ok(new SongSearchResponse
            {
                LocalMatches = localMatches,
                ExternalMatches = externalResults
            });
        }
 
        public record ImportRequest(string Artist, string Track, string? UserId = null);

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
            var normArtist = _chordResolver.Normalize(cleanArtist);
            var normTrack = _chordResolver.Normalize(cleanTrack);

            // ==========================================
            // 1. CHECK DB FIRST (Prevents Duplicates)
            // ==========================================
            var existingSong = await _db.Songs
    .Include(s => s.PrimaryArtist)
    .Where(s =>
        EF.Functions.TrigramsSimilarity(s.NormalizedName, normTrack) > 0.6 &&
        EF.Functions.TrigramsSimilarity(s.PrimaryArtist.NormalizedName, normArtist) > 0.6)
    .OrderByDescending(s => EF.Functions.TrigramsSimilarity(s.NormalizedName, normTrack))
    .FirstOrDefaultAsync(ct);

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

            var userSkillLevel = Difficulty.Intermediate;
            if (!string.IsNullOrEmpty(req.UserId))
            {
                var userProfile = await _db.UserProfiles
                    .FirstOrDefaultAsync(u => u.UserId == req.UserId, ct);
                if (userProfile != null) userSkillLevel = userProfile.SkillLevel;
            }

            // ==========================================
            // 2. NOT IN DB -> Fetch from Last.fm
            // ==========================================
            var detail = await _lastFm.GetTrackInfoAsync(cleanArtist, cleanTrack, ct);
            if (detail is null) return NotFound("Track not found on Last.fm.");

            var finalArtistName = CleanInput(detail.Artist);
            var finalTrackName = CleanInput(detail.Name);
            var finalNormArtist = _chordResolver.Normalize(finalArtistName);
            var finalNormTrack = _chordResolver.Normalize(finalTrackName);

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
                ReleaseDate = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            _db.Songs.Add(song);
            await _db.SaveChangesAsync(ct);
            var (providerKey, apiKey) = await _aiProviderResolver.ResolveAsync(req.UserId, ct);

            GeminiChordResponse? generatedChords = null;
            try
            {
                generatedChords = await _chordFactory.GenerateChordsAsync(
                    artist.Name, song.Name, lyricsText, Difficulty.Intermediate,
                    preferredProviderKey: providerKey, apiKeyOverride: apiKey, ct);
            }
            catch (AllProvidersFailedException ex)
            {
                _logger.LogWarning(ex, "All AI providers failed generating chords for {Artist} - {Track}; falling back to lyrics-only version.",
                    artist.Name, song.Name);
            }

            if (generatedChords?.OriginalVersion != null && generatedChords?.AlternateVersion != null)
            {
                if (generatedChords.EstimatedBpm > 0)
                {
                    song.BPM = generatedChords.EstimatedBpm; // picked up by the SaveChangesAsync below
                }

                // 1. Target / Original Accurate Version
                var originalVer = new SongVersion
                {
                    SongId = song.Id,
                    TabData = generatedChords.OriginalVersion.TabData,
                    StrumPattern = generatedChords.OriginalVersion.StrumPattern,
                    Tuning = generatedChords.OriginalVersion.Tuning,
                    CapoPos = generatedChords.OriginalVersion.CapoPos,
                    Difficulty = generatedChords.OriginalVersion.Difficulty,
                    IsDefault = true,
                    SourceName = "Gemini AI (Original Accurate)",
                    DateScraped = DateTime.UtcNow,
                    StructuredTabJson = generatedChords.OriginalVersion.StructuredTab != null
    ? System.Text.Json.JsonSerializer.Serialize(generatedChords.OriginalVersion.StructuredTab)
    : null,
                };

                // 2. Alternate Version
                var altVer = new SongVersion
                {
                    SongId = song.Id,
                    TabData = generatedChords.AlternateVersion.TabData,
                    StrumPattern = generatedChords.AlternateVersion.StrumPattern,
                    Tuning = generatedChords.AlternateVersion.Tuning,
                    CapoPos = generatedChords.AlternateVersion.CapoPos,
                    Difficulty = generatedChords.AlternateVersion.Difficulty,
                    IsDefault = false,
                    SourceName = "Gemini AI (Simplified Alt)",
                    DateScraped = DateTime.UtcNow,
                    StructuredTabJson = generatedChords.AlternateVersion.StructuredTab != null
    ? System.Text.Json.JsonSerializer.Serialize(generatedChords.AlternateVersion.StructuredTab)
    : null,
                };
                originalVer.Chords = await _chordResolver.ResolveChordsAsync(
    generatedChords.OriginalVersion.ChordDefinitions, originalVer.Tuning, originalVer.Difficulty, ct);
                altVer.Chords = await _chordResolver.ResolveChordsAsync(
                    generatedChords.AlternateVersion.ChordDefinitions, altVer.Tuning, altVer.Difficulty, ct);
                originalVer.NotationType = generatedChords.OriginalVersion.NotationType;
                altVer.NotationType = generatedChords.AlternateVersion.NotationType;

                _db.SongVersions.Add(originalVer);
                _db.SongVersions.Add(altVer);
            }
            else
            {
                // Fallback version if Gemini is unavailable
                _db.SongVersions.Add(new SongVersion
                {
                    SongId = song.Id,
                    Difficulty = userSkillLevel,
                    Tuning = Tuning.Standard,
                    CapoPos = CapoPos.None,
                    StrumPattern = StrumPattern.DownDownUp,
                    IsDefault = true,
                    TabData = lyricsText ?? string.Empty
                });
            }
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

        //// Standardizes string for database unique indexes
        //private static string Normalize(string input)
        //{
        //    if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        //    return input.Trim().ToLowerInvariant();
        //}
        // GET /api/songsearch/status/5 — the frontend polls this while scraping runs
        [HttpGet("status/{id}")]
        public async Task<ActionResult<ScrapeRequest>> Status(int id)
        {
            var req = await _db.ScrapeRequests.FindAsync(id);
            return req is null ? NotFound() : Ok(req);
        }

        

        
    }
}
