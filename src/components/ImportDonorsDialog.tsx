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
      'First Name/Org Name,Last Name,Formal Name,Preferred Name,Organization?,Phone,Mobile Phone,Alternate Phone,Work Phone,Email,Alternate Email,Spouse Name,Comments,Organization,Lifetime Contribution Total,Lifetime Non Cash Gift Total,Lifetime Soft Credit Total,YTD Gift Total,Fiscal YTD Gift Total,Last Year Gift Total,Last Fiscal Year Gift Total,First Transaction Date,Last Gift Amount,Last Gift Date,Largest Gift Amount,Largest Gift Date,Number of Gifts,Lifetime Gift Total,Total Pledge Balance,Join Date,Address Line 1,Address Line 2,City,State,Postal Code,Country,Campaign,Frequency,Coupon Code',
      'John,Smith,Mr. John Smith,John,No,555-0100,555-0101,555-0102,555-0103,john@example.com,jsmith@example.com,Mary Smith,VIP donor,Acme Corp,5000,500,0,1200,1000,800,750,2020-01-15,250,2024-03-20,500,2023-12-25,20,5000,0,2020-01-15,123 Main St,Apt 4B,Springfield,IL,62701,USA,General,one-time,',
      'Acme Corporation,,Acme Corp,Acme,Yes,555-0200,,,555-0201,info@acme.com,donations@acme.com,,Corporate sponsor,Acme Corporation,50000,0,0,12000,10000,8000,7500,2019-06-01,2000,2024-03-15,5000,2023-11-30,24,50000,5000,2019-06-01,456 Business Blvd,,Tech City,CA,94000,USA,Corporate Giving,monthly,'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comprehensive-donor-import-template.csv';
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
            <p><strong>Core Fields:</strong> First Name/Org Name, Email</p>
            <p><strong>Contact:</strong> Phone, Mobile Phone, Work Phone, Alternate Phone, Alternate Email</p>
            <p><strong>Address:</strong> Address Line 1, Address Line 2, City, State, Postal Code, Country</p>
            <p><strong>Financial:</strong> Last Gift Amount, Lifetime Contribution Total, Number of Gifts</p>
            <p><strong>Smart Import:</strong> System auto-detects organizations, consolidates phone/email, merges duplicates by email</p>
            <p><strong>Profile Consolidation:</strong> Existing donors (matched by email) will be updated with new information</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
