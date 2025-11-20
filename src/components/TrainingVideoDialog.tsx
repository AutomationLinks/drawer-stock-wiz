import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { extractVimeoId, isValidVimeoUrl } from "@/utils/vimeoHelpers";

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

interface TrainingVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video?: {
    id: string;
    title: string;
    description: string | null;
    vimeo_url: string;
    category: string;
    display_order: number;
    active: boolean;
  };
  onSuccess: () => void;
}

export const TrainingVideoDialog = ({ open, onOpenChange, video, onSuccess }: TrainingVideoDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [category, setCategory] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description || "");
      setVimeoUrl(video.vimeo_url);
      setCategory(video.category);
      setDisplayOrder(video.display_order.toString());
      setActive(video.active);
    } else {
      setTitle("");
      setDescription("");
      setVimeoUrl("");
      setCategory("");
      setDisplayOrder("0");
      setActive(true);
    }
  }, [video, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    if (!vimeoUrl.trim()) {
      toast.error("Please enter a Vimeo URL");
      return;
    }
    
    if (!isValidVimeoUrl(vimeoUrl)) {
      toast.error("Please enter a valid Vimeo URL (e.g., vimeo.com/123456789)");
      return;
    }
    
    if (!category) {
      toast.error("Please select a category");
      return;
    }

    setSaving(true);

    try {
      const videoData = {
        title: title.trim(),
        description: description.trim() || null,
        vimeo_url: vimeoUrl.trim(),
        category,
        display_order: parseInt(displayOrder) || 0,
        active,
      };

      if (video) {
        const { error } = await supabase
          .from("training_videos")
          .update(videoData)
          .eq("id", video.id);
        
        if (error) throw error;
        toast.success("Video updated successfully");
      } else {
        const { error } = await supabase
          .from("training_videos")
          .insert(videoData);
        
        if (error) throw error;
        toast.success("Video added successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving video:", error);
      toast.error("Failed to save video");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{video ? "Edit Training Video" : "Add New Training Video"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Getting Started with Inventory"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this video covers..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="vimeo-url">Vimeo URL or Video ID *</Label>
            <Input
              id="vimeo-url"
              value={vimeoUrl}
              onChange={(e) => setVimeoUrl(e.target.value)}
              placeholder="e.g., vimeo.com/123456789 or just 123456789"
              required
            />
            {vimeoUrl && extractVimeoId(vimeoUrl) && (
              <p className="text-xs text-muted-foreground mt-1">
                Video ID: {extractVimeoId(vimeoUrl)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="display-order">Display Order</Label>
            <Input
              id="display-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lower numbers appear first (0 = first position)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={active}
              onCheckedChange={setActive}
            />
            <Label htmlFor="active">Active (show on page)</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : video ? "Update Video" : "Add Video"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
