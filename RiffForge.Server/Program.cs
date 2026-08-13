using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Services;
using RiffForge.Server.Services.Interfaces;
using RiffForge.Server.Services.Validation;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Configuration.AddUserSecrets<Program>();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<RiffForgeDbContext>(options =>
    options.UseNpgsql(connectionString));
builder.Services.Configure<AiSettings>(builder.Configuration.GetSection("Ai"));
builder.Services.AddHttpClient<ILastFmService, LastFmService>();
builder.Services.AddHttpClient<IAlbumArtService, AlbumArtService>();
builder.Services.AddHttpClient<ILyricsService, LyricsService>();
builder.Services.AddScoped<IChordGenerationProvider, GeminiChordService>();
builder.Services.AddScoped<IChordGenerationProvider, ClaudeChordProvider>();
builder.Services.AddScoped<ChordArrangementValidator>();
builder.Services.AddScoped<IChordProviderFactory, ChordProviderFactory>();
builder.Services.AddScoped<IApiKeyProtector, ApiKeyProtector>();
builder.Services.AddScoped<IChordResolverService, ChordResolverService>();
builder.Services.AddScoped<AiProviderResolver>();
builder.Services.AddHttpClient<GeminiChordService>()
    .SetHandlerLifetime(TimeSpan.FromMinutes(5));
builder.Services.AddHttpClient<ClaudeChordProvider>()
    .SetHandlerLifetime(TimeSpan.FromMinutes(5));
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    // Defaults are quite strict (upper+lower+digit+special, 6 char min).
    // Loosen deliberately, don't just discover this in prod when signups fail.
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8;

    options.User.RequireUniqueEmail = true;
})
    .AddEntityFrameworkStores<RiffForgeDbContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = 403;
        return Task.CompletedTask;
    };

    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax; // see CORS caveat below if frontend runs on a different port in dev
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; // Always in production
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins("https://localhost:56315") // adjust to your actual dev server
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
// Program.cs
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // 1. Prevents circular reference crashes
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;

        // 2. Serializes Enums as strings ("Completed" instead of 2)
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());

    });
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseCors("Frontend");
app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
