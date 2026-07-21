namespace RiffForge.Server.Services.Interfaces
{
    public interface ILyricsService
    {
        Task<string> GetLyricsAsync(string artist, string track, CancellationToken ct = default);
    }
}
