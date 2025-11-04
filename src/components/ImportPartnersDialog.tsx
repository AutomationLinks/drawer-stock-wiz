import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { importPartners, downloadPartnerTemplate } from "@/utils/importPartners";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ImportPartnersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportPartnersDialog = ({ open, onOpenChange }: ImportPartnersDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; errors: string[]; duplicates: number } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setResults(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResults(null);

    try {
      const importResults = await importPartners(file, (current, total) => {
        setProgress(Math.round((current / total) * 100));
      });

      setResults(importResults);
      queryClient.invalidateQueries({ queryKey: ["partners"] });

      toast({
        title: "Import Complete",
        description: `Successfully imported ${importResults.success} partners. ${importResults.duplicates} duplicates skipped. ${importResults.errors.length} errors.`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setProgress(0);
    setResults(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Partners from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with partner information. Download the template below for the correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-center">
            <Button variant="outline" onClick={downloadPartnerTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Download CSV Template
            </Button>
          </div>

          <div className="space-y-2">
            <label htmlFor="csv-file" className="text-sm font-medium">
              Select CSV File
            </label>
            <div className="flex items-center gap-2">
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importing}
                className="flex-1 text-sm"
              />
              {file && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing partners...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {results && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{results.success} partners imported</span>
              </div>
              {results.duplicates > 0 && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{results.duplicates} duplicates skipped</span>
                </div>
              )}
              {results.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">{results.errors.length} errors</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto rounded bg-muted p-2 text-xs">
                    {results.errors.map((error, i) => (
                      <div key={i} className="text-muted-foreground">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button onClick={handleImport} disabled={!file || importing} className="gap-2">
              <Upload className="h-4 w-4" />
              Import Partners
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
