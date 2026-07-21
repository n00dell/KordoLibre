using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Configuration.AddUserSecrets<Program>();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<RiffForgeDbContext>(options =>
    options.UseNpgsql(connectionString));
builder.Services.AddHttpClient<ILastFmService, LastFmService>();
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
