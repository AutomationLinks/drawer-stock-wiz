import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { importCompanies, ImportResult } from "@/utils/importCompanies";
import { Download, Upload, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ImportCompaniesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ImportCompaniesDialog = ({ open, onOpenChange, onSuccess }: ImportCompaniesDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const downloadTemplate = () => {
    const template = `Created Time,Last Modified Time,Contact ID,Customer Sub Type,Companies,First Name,Last Name,EmailID
2024-01-15,2024-01-15,CUST-001,Partner,ABC Corporation,John,Doe,john@abc.com
2024-01-16,2024-01-20,CUST-002,Client,XYZ Inc,Jane,Smith,jane@xyz.com`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "companies_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Invalid File",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const importResult = await importCompanies(
        file,
        (current, total) => {
          setProgress(Math.round((current / total) * 100));
        },
        skipDuplicates
      );

      setResult(importResult);

      if (importResult.success) {
        toast({
          title: "Import Complete",
          description: `Successfully imported ${importResult.successCount} companies`,
        });
        onSuccess();
      } else {
        toast({
          title: "Import Failed",
          description: "No companies were imported",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadErrorLog = () => {
    if (!result || result.errors.length === 0) return;

    const errorLog = result.errors
      .map((err) => `Row ${err.row}: ${err.message}`)
      .join("\n");

    const blob = new Blob([errorLog], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_errors.txt";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    if (!importing) {
      setFile(null);
      setResult(null);
      setProgress(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Companies from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Button onClick={downloadTemplate} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={importing}
            >
              <Upload className="mr-2 h-4 w-4" />
              {file ? file.name : "Select CSV File"}
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="skipDuplicates"
              checked={skipDuplicates}
              onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
              disabled={importing}
            />
            <Label htmlFor="skipDuplicates" className="text-sm cursor-pointer">
              Skip duplicate Contact IDs
            </Label>
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Importing companies... {progress}%
              </div>
              <Progress value={progress} />
            </div>
          )}

          {result && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div>Successfully imported: {result.successCount}</div>
                  <div>Errors: {result.errorCount}</div>
                  {result.errors.length > 0 && (
                    <Button
                      onClick={downloadErrorLog}
                      variant="link"
                      className="h-auto p-0 text-sm"
                    >
                      Download Error Log
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button onClick={handleClose} variant="outline" disabled={importing}>
              Close
            </Button>
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
