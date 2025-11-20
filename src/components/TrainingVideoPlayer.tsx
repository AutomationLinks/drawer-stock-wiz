import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { extractVimeoId, getVimeoEmbedUrl } from "@/utils/vimeoHelpers";

interface TrainingVideoPlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: {
    title: string;
    description: string | null;
    vimeo_url: string;
  } | null;
}

export const TrainingVideoPlayer = ({ open, onOpenChange, video }: TrainingVideoPlayerProps) => {
  if (!video) return null;

  const vimeoId = extractVimeoId(video.vimeo_url);
  const embedUrl = vimeoId ? getVimeoEmbedUrl(vimeoId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{video.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {embedUrl ? (
            <div className="aspect-video">
              <iframe
                src={embedUrl}
                className="w-full h-full rounded-md"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Invalid video URL</p>
            </div>
          )}
          {video.description && (
            <div>
              <p className="text-sm text-muted-foreground">{video.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
