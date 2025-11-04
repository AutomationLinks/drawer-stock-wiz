import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download, Upload } from "lucide-react";
import { importDonors } from "@/utils/importDonors";
import { toast } from "sonner";

interface ImportDonorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportDonorsDialog = ({ open, onOpenChange }: ImportDonorsDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadTemplate = () => {
    const csvContent = [
      'Name,Email,Phone,Address,Organization,Amount,Frequency,Campaign,Coupon Code,Date',
      'John Doe,john@example.com,555-123-4567,"123 Main St, City, ST 12345",Acme Inc,100,one-time,General,,2024-01-15',
      'Jane Smith,jane@example.com,555-987-6543,"456 Oak Ave, Town, ST 67890",,50,monthly,"Drawers of Hope",SAVE10,2024-01-20'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'donor-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setImporting(true);
    setProgress(10);

    try {
      setProgress(30);
      const result = await importDonors(file);
      setProgress(100);

      if (result.errors.length > 0) {
        toast.error(
          `Import completed with errors. ${result.success} imported, ${result.duplicates} duplicates skipped. ${result.errors.length} errors.`,
          {
            description: result.errors.slice(0, 3).join(', '),
          }
        );
      } else {
        toast.success(
          `Successfully imported ${result.success} donors! ${result.duplicates} duplicates were skipped.`
        );
      }

      setFile(null);
      onOpenChange(false);
    } catch (error) {
      toast.error("Import failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Donors from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Download the template to see the required format
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={importing}
            />
          </div>

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                Importing donors...
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              disabled={importing}
            >
              Cancel
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Required columns:</strong> Name, Email, Phone, Amount, Frequency, Campaign</p>
            <p><strong>Optional columns:</strong> Address, Organization, Coupon Code, Date</p>
            <p><strong>Frequency values:</strong> "one-time" or "monthly"</p>
            <p><strong>Note:</strong> Duplicates (same email + date) will be skipped</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
