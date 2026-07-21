namespace RiffForge.Server.Services.Interfaces
{
    public interface IAlbumArtService
    {
        Task<string?> GetCoverArtUrlAsync(string artist, string track);
    }
}
