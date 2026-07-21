namespace RiffForge.Server.Services
{
    public interface IAlbumArtService
    {
        Task<string?> GetCoverArtUrlAsync(string artist, string track);
    }
}
