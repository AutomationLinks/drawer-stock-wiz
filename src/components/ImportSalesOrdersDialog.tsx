import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { importSalesOrdersFromCSV } from "@/utils/importSalesOrders";
import { AlertCircle, CheckCircle2, Download, FileUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportSalesOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ImportSalesOrdersDialog = ({ open, onOpenChange, onSuccess }: ImportSalesOrdersDialogProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ processed: 0, total: 0, successful: 0, failed: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setStats({ processed: 0, total: 0, successful: 0, failed: 0 });
    setErrors([]);
    setIsComplete(false);

    try {
      const result = await importSalesOrdersFromCSV(
        file,
        (current, total, successful, failed) => {
          setStats({ processed: current, total, successful, failed });
          setProgress((current / total) * 100);
        }
      );

      setIsComplete(true);
      setErrors(result.errors);

      if (result.success) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${result.successCount} orders${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`,
        });
        
        if (result.errors.length === 0) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        toast({
          title: "Import failed",
          description: "There was an error importing the sales orders",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "An unexpected error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadErrorLog = () => {
    const errorLog = errors.join('\n');
    const blob = new Blob([errorLog], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    if (!isImporting) {
      onOpenChange(false);
      setTimeout(() => {
        setIsComplete(false);
        setProgress(0);
        setStats({ processed: 0, total: 0, successful: 0, failed: 0 });
        setErrors([]);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Sales Orders from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your sales orders. Large files will be processed in batches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isImporting && !isComplete && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  CSV should have one row per line item. Required columns: Sales Order Number, Order Date, Customer Name, Item Name, Quantity Ordered, Item Price
                </AlertDescription>
              </Alert>

              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 space-y-4">
                <FileUp className="h-12 w-12 text-muted-foreground" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button type="button" onClick={() => fileInputRef.current?.click()}>
                    Select CSV File
                  </Button>
                </label>
                <p className="text-sm text-muted-foreground">
                  Supports files with thousands of records
                </p>
              </div>
            </div>
          )}

          {isImporting && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing sales orders...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Processed</div>
                  <div className="text-lg font-semibold">{stats.processed} / {stats.total}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Successful</div>
                  <div className="text-lg font-semibold text-green-600">{stats.successful}</div>
                </div>
              </div>

              {stats.failed > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {stats.failed} record(s) failed to import
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {isComplete && (
            <div className="space-y-4">
              <Alert className={errors.length > 0 ? "border-yellow-500" : "border-green-500"}>
                <CheckCircle2 className={`h-4 w-4 ${errors.length > 0 ? "text-yellow-500" : "text-green-500"}`} />
                <AlertDescription>
                  Import complete! Successfully imported {stats.successful} orders
                  {errors.length > 0 && ` with ${errors.length} errors`}
                </AlertDescription>
              </Alert>

              {errors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Errors encountered:</div>
                  <div className="max-h-40 overflow-y-auto space-y-1 text-sm bg-muted p-3 rounded">
                    {errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-destructive">{error}</div>
                    ))}
                    {errors.length > 10 && (
                      <div className="text-muted-foreground">
                        ...and {errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadErrorLog}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Full Error Log
                  </Button>
                </div>
              )}

              <Button
                onClick={handleClose}
                className="w-full"
              >
                {errors.length > 0 ? "Close" : "Done"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
