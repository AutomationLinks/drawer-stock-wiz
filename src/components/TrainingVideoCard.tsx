import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Play } from "lucide-react";
import { extractVimeoId, getVimeoThumbnail } from "@/utils/vimeoHelpers";

interface TrainingVideoCardProps {
  video: {
    id: string;
    title: string;
    description: string | null;
    vimeo_url: string;
    category: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onPlay: () => void;
}

export const TrainingVideoCard = ({ video, onEdit, onDelete, onPlay }: TrainingVideoCardProps) => {
  const [imageError, setImageError] = useState(false);
  const vimeoId = extractVimeoId(video.vimeo_url);
  const thumbnailUrl = vimeoId ? getVimeoThumbnail(vimeoId) : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div 
          className="relative aspect-video bg-muted cursor-pointer group"
          onClick={onPlay}
        >
          {thumbnailUrl && !imageError ? (
            <img 
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-2 line-clamp-2">{video.title}</CardTitle>
        {video.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{video.description}</p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2">
        <Button variant="outline" size="sm" onClick={onPlay} className="flex-1">
          <Play className="w-4 h-4 mr-1" />
          Play
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
