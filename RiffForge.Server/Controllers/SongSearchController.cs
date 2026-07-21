using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RiffForge.Server.Data;
using RiffForge.Server.Models;
using RiffForge.Server.Models.LastFm;
using RiffForge.Server.Services;

namespace RiffForge.Server.Controllers
{
    [Route("api/songsearch")]
    [ApiController]
    public class SongSearchController : ControllerBase
    {
        private readonly ILastFmService _lastFm;
        private readonly RiffForgeDbContext _db; // however your DbContext is named

        public SongSearchController(ILastFmService lastFm, RiffForgeDbContext db)
        {
            _lastFm = lastFm;
            _db = db;
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
            var detail = await _lastFm.GetTrackInfoAsync(req.Artist, req.Track, ct);
            if (detail is null) return NotFound("Track not found on Last.fm.");

            var scrapeRequest = new ScrapeRequest
            {
                Query = $"{detail.Artist} - {detail.Name}",
                Status = Models.Enums.ScrapeStatus.Pending
            };
            _db.ScrapeRequests.Add(scrapeRequest);
            await _db.SaveChangesAsync(ct);

            // TODO once sources are decided: enqueue a background job (hosted
            // service / queue) that scrapes UG etc., updates scrapeRequest.Status,
            // and sets ResultSongId when a Song + SongVersion get created.

            return Ok(scrapeRequest);
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
