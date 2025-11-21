import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Printer, Heart } from "lucide-react";
import drawerLogo from "@/assets/drawer-logo-horizontal.png";

interface DonationReceiptProps {
  data: {
    name: string;
    email: string;
    phone: string;
    organization?: string;
    address?: string;
    campaign: string;
    frequency: string;
    actualAmount: number;
    processingFee: number;
    discount: string;
    total: string;
    date: string;
    transactionId: string;
    paymentMethod: string;
    couponCode?: string;
  };
  onNewDonation: () => void;
}

export const DonationReceipt = ({ data, onNewDonation }: DonationReceiptProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Success Message - Hidden in print */}
      <div className="text-center space-y-3 print:hidden">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Heart className="w-8 h-8 text-green-600 fill-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Thank You for Your Donation!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your generous contribution has been processed successfully. A copy of your receipt is below.
        </p>
      </div>

      {/* Receipt Card */}
      <Card className="max-w-3xl mx-auto print:shadow-none print:border-0">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <img 
              src={drawerLogo} 
              alt="The Drawer Inc" 
              className="h-16 mx-auto object-contain"
            />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">THE DRAWER INC</p>
              <p>14147 Autumnwood Way</p>
              <p>Rosemount, MN 55068</p>
              <p className="pt-2">EIN: 82-2834119</p>
              <p className="text-xs">A 501(c)(3) Public Charity • 509(a)(2)</p>
            </div>
          </div>

          <Separator />

          {/* Receipt Details */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Date:</span>
              <span className="text-sm font-medium text-foreground">{formatDate(data.date)}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Donor Name:</span>
              <span className="text-sm font-medium text-foreground text-right">{data.name}</span>
            </div>

            {data.organization && (
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">Organization:</span>
                <span className="text-sm font-medium text-foreground text-right">{data.organization}</span>
              </div>
            )}

            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Email:</span>
              <span className="text-sm font-medium text-foreground text-right break-all">{data.email}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Phone:</span>
              <span className="text-sm font-medium text-foreground text-right">{data.phone}</span>
            </div>

            {data.address && (
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">Address:</span>
                <span className="text-sm font-medium text-foreground text-right max-w-xs">{data.address}</span>
              </div>
            )}

            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Campaign:</span>
              <span className="text-sm font-medium text-foreground text-right">{data.campaign}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Frequency:</span>
              <span className="text-sm font-medium text-foreground text-right">
                {data.frequency === "monthly" ? "Monthly Recurring" : "One-Time"}
              </span>
            </div>
          </div>

          <Separator />

          {/* Payment Breakdown */}
          <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Donation Amount:</span>
              <span className="font-medium text-foreground">${formatCurrency(data.actualAmount)}</span>
            </div>

            {data.processingFee > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Processing Fee Covered:</span>
                <span className="font-medium text-foreground">${formatCurrency(data.processingFee)}</span>
              </div>
            )}

            {parseFloat(data.discount) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600">Discount Applied {data.couponCode && `(${data.couponCode})`}:</span>
                <span className="font-medium text-green-600">-${formatCurrency(data.discount)}</span>
              </div>
            )}

            <Separator className="my-2" />

            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Total Amount Charged:</span>
              <span className="text-2xl font-bold text-primary">${formatCurrency(data.total)}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-medium text-foreground">{data.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID:</span>
              <span className="font-medium text-foreground text-right break-all text-xs">{data.transactionId}</span>
            </div>
          </div>

          <Separator />

          {/* Tax-Deductible Information */}
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground">
              Thank you for your generous contribution to The Drawer Inc.
            </p>
            <p>
              The Drawer Inc is a tax-exempt public charity under Internal Revenue Code Section 501(c)(3). 
              Your contribution is tax-deductible to the fullest extent allowed by law.
            </p>
            <p>
              No goods or services were provided in exchange for this donation.
            </p>
            <p className="font-medium text-foreground">
              Please retain this receipt for your tax records.
            </p>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Sincerely,</p>
            <p className="font-semibold text-foreground">The Drawer Inc</p>
            <p>(877) 829-5500</p>
            <p>info@thedrawer.org</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - Hidden in print */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center print:hidden">
        <Button onClick={handlePrint} variant="outline" size="lg">
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button onClick={handlePrint} variant="outline" size="lg">
          <Download className="mr-2 h-4 w-4" />
          Download as PDF
        </Button>
        <Button onClick={onNewDonation} size="lg" className="bg-primary">
          <Heart className="mr-2 h-4 w-4" />
          Make Another Donation
        </Button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          body {
            background: white !important;
          }
          button, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
