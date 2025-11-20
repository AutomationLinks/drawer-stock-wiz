import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmbedCodeCardProps {
  title: string;
  description: string;
  path: string;
  defaultHeight?: number;
}

export const EmbedCodeCard = ({ 
  title, 
  description, 
  path,
  defaultHeight = 800 
}: EmbedCodeCardProps) => {
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState(defaultHeight);
  const [width, setWidth] = useState("100%");
  const { toast } = useToast();

  const embedUrl = `${window.location.origin}${path}`;
  const iframeCode = `<iframe 
  src="${embedUrl}" 
  width="${width}" 
  height="${height}px" 
  frameborder="0"
  title="${title}">
</iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <a 
            href={embedUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Preview <ExternalLink className="h-3 w-3" />
          </a>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customization Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`width-${path}`}>Width</Label>
            <Input
              id={`width-${path}`}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="100%"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`height-${path}`}>Height (px)</Label>
            <Input
              id={`height-${path}`}
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              placeholder="800"
            />
          </div>
        </div>

        {/* Embed Code */}
        <div className="space-y-2">
          <Label>Embed Code</Label>
          <div className="relative">
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
              <code>{iframeCode}</code>
            </pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={copyToClipboard}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="border rounded-md overflow-hidden bg-muted">
            <iframe
              src={embedUrl}
              width="100%"
              height="300px"
              className="border-0"
              title={`${title} Preview`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
