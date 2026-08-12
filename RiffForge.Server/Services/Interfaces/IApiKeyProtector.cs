namespace RiffForge.Server.Services.Interfaces
{
    public interface IApiKeyProtector
    {
        string Protect(string plaintextKey);
        string Unprotect(string protectedKey);
    }
}
