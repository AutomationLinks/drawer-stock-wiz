import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Search, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrainingVideoCard } from "@/components/TrainingVideoCard";
import { TrainingVideoDialog } from "@/components/TrainingVideoDialog";
import { TrainingVideoPlayer } from "@/components/TrainingVideoPlayer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const VIDEO_CATEGORIES = [
  { value: "getting-started", label: "🚀 Getting Started" },
  { value: "inventory", label: "📦 Inventory Management" },
  { value: "donate", label: "💰 Donations & Fundraising" },
  { value: "volunteer", label: "🙋 Volunteer Management" },
  { value: "analytics", label: "📊 Analytics & Reports" },
  { value: "companies", label: "🏢 Company Management" },
  { value: "sales-orders", label: "📋 Sales Orders" },
  { value: "invoices", label: "🧾 Invoicing" },
  { value: "partners", label: "🤝 Partner Locations" },
  { value: "contacts", label: "👥 Contact Management" },
  { value: "newsletters", label: "📧 Newsletters" },
  { value: "website", label: "🌐 Website Edits" },
  { value: "automation", label: "⚙️ Automation" },
  { value: "calendars", label: "📅 Calendars" },
];

type Video = {
  id: string;
  title: string;
  description: string | null;
  vimeo_url: string;
  category: string;
  display_order: number;
  active: boolean;
};

export default function TrainingVideos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | undefined>();
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: videos, isLoading } = useQuery({
    queryKey: ["training-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_videos")
        .select("*")
        .eq("active", true)
        .order("category", { ascending: true })
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Video[];
    },
  });

  const filteredVideos = videos?.filter((video) => {
    const matchesSearch = 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || video.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const videosByCategory = filteredVideos?.reduce((acc, video) => {
    if (!acc[video.category]) acc[video.category] = [];
    acc[video.category].push(video);
    return acc;
  }, {} as Record<string, Video[]>);

  // Sort categories with "getting-started" first, then alphabetically
  const sortedCategories = Object.keys(videosByCategory || {}).sort((a, b) => {
    if (a === "getting-started") return -1;
    if (b === "getting-started") return 1;
    return a.localeCompare(b);
  });

  const handleAddVideo = () => {
    setSelectedVideo(undefined);
    setDialogOpen(true);
  };

  const handleEditVideo = (video: Video) => {
    setSelectedVideo(video);
    setDialogOpen(true);
  };

  const handlePlayVideo = (video: Video) => {
    setPlayingVideo(video);
    setPlayerOpen(true);
  };

  const handleDeleteClick = (videoId: string) => {
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;

    try {
      const { error } = await supabase
        .from("training_videos")
        .delete()
        .eq("id", videoToDelete);

      if (error) throw error;

      toast.success("Video deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["training-videos"] });
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    } finally {
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["training-videos"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Training Videos</h1>
            <p className="text-muted-foreground">
              Learn how to use our system with these helpful video tutorials
            </p>
          </div>
          <Button onClick={handleAddVideo}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Video
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {VIDEO_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        ) : !filteredVideos || filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Training Videos Yet</h3>
            <p className="text-muted-foreground mb-6">
              Get started by adding your first training video to help your team learn the system.
            </p>
            <Button onClick={handleAddVideo}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Video
            </Button>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={sortedCategories} className="space-y-4">
            {sortedCategories.map((category) => {
              const categoryVideos = videosByCategory?.[category] || [];
              const categoryInfo = VIDEO_CATEGORIES.find((c) => c.value === category);
              return (
                <AccordionItem key={category} value={category} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>{categoryInfo?.label || category}</span>
                      <span className="text-sm text-muted-foreground">
                        ({categoryVideos.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                      {categoryVideos.map((video) => (
                        <TrainingVideoCard
                          key={video.id}
                          video={video}
                          onEdit={() => handleEditVideo(video)}
                          onDelete={() => handleDeleteClick(video.id)}
                          onPlay={() => handlePlayVideo(video)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </main>

      <TrainingVideoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        video={selectedVideo}
        onSuccess={handleSuccess}
      />

      <TrainingVideoPlayer
        open={playerOpen}
        onOpenChange={setPlayerOpen}
        video={playingVideo}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training video? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
