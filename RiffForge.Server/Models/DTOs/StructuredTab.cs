namespace RiffForge.Server.Models.DTOs
{
    public class TabColumn { public List<int> Frets { get; set; } = new(); }
    public class TabSection { public string? Label { get; set; } public List<TabColumn> Columns { get; set; } = new(); }
    public class StructuredTab
    {
        
        public List<TabSection> Sections { get; set; } = new(); 
    }
}
