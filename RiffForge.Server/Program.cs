using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Services;
using RiffForge.Server.Services.Interfaces;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Configuration.AddUserSecrets<Program>();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<RiffForgeDbContext>(options =>
    options.UseNpgsql(connectionString));
builder.Services.AddHttpClient<ILastFmService, LastFmService>();
builder.Services.AddHttpClient<IAlbumArtService, AlbumArtService>();
builder.Services.AddHttpClient<ILyricsService, LyricsService>();
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


var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
builder.Services.AddEndpointsApiExplorer();
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
