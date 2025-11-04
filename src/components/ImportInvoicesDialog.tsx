import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { importInvoicesFromCSV } from "@/utils/importInvoices";
import { Upload, AlertCircle, CheckCircle, Download } from "lucide-react";

interface ImportInvoicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportInvoicesDialog = ({ open, onOpenChange }: ImportInvoicesDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: boolean; successCount: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const result = await importInvoicesFromCSV(
        file,
        (current, total, successful, failed) => {
          setProgress(Math.round((current / total) * 100));
        }
      );

      setResult(result);
      
      if (result.success) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${result.successCount} invoice(s)`,
        });
      } else {
        toast({
          title: "Import failed",
          description: "There were errors during import. Check the error log below.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadErrorLog = () => {
    if (!result?.errors.length) return;

    const errorText = result.errors.join("\n");
    const blob = new Blob([errorText], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice_import_errors_${new Date().toISOString()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetDialog = () => {
    setFile(null);
    setImporting(false);
    setProgress(0);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Invoices from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with invoice data. Required columns: Invoice Number, Invoice Date, Customer Name, Item Name, Quantity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file"
            />
            <label htmlFor="csv-file" className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Select CSV File
                </span>
              </Button>
            </label>
            {file && <span className="text-sm text-muted-foreground">{file.name}</span>}
          </div>

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">Importing... {progress}%</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-2">
              {result.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Successfully imported {result.successCount} invoice(s)
                    {result.errors.length > 0 && ` with ${result.errors.length} error(s)`}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Import failed. {result.errors.length} error(s) occurred.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Log */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Error Log ({result.errors.length} errors)</p>
                    <Button size="sm" variant="outline" onClick={downloadErrorLog}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Log
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded p-2 text-xs font-mono bg-muted">
                    {result.errors.map((error, i) => (
                      <div key={i} className="mb-1">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button onClick={handleImport} disabled={!file || importing}>
                {importing ? "Importing..." : "Import"}
              </Button>
            )}
            {result && (
              <Button onClick={resetDialog}>
                Import Another File
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
