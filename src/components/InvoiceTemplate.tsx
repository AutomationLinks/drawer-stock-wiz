import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { format } from "date-fns";
import logo from "@/assets/drawer-logo-invoice.jpg";

interface InvoiceTemplateProps {
  order: {
    sales_order_number?: string;
    invoice_number?: string;
    order_date: string;
    due_date?: string;
    payment_terms?: string;
    subtotal: number;
    total: number;
    notes?: string;
    customers: { customer_name: string; billing_address: string };
    sales_order_items?: Array<{
      item_name: string;
      quantity_ordered: number;
      item_price: number;
      item_total: number;
      usage_unit: string;
    }>;
    invoice_items?: Array<{
      item_name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
  };
  onClose: () => void;
  isInvoice?: boolean;
}

export const InvoiceTemplate = ({ order, onClose, isInvoice = false }: InvoiceTemplateProps) => {
  const items = isInvoice ? order.invoice_items : order.sales_order_items;
  const documentNumber = isInvoice ? order.invoice_number : order.sales_order_number;
  const documentTitle = isInvoice ? "INVOICE" : "SALES ORDER";
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
        </div>

        <div className="bg-card border rounded-lg p-8 print:border-0">
          <div className="flex justify-between items-start mb-8">
            <div>
              <img src={logo} alt="The Drawer Logo" className="h-16 mb-2" />
              <p className="text-sm text-muted-foreground">
                The Drawer<br/>
                Burnsville Minnesota 55337<br/>
                U.S.A
              </p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold mb-2">{documentTitle}</h1>
              <p className="text-lg font-medium">{isInvoice ? 'Invoice' : 'Sales Order'}# {documentNumber}</p>
              {isInvoice && (
                <p className="text-sm text-muted-foreground mt-1">Donation Receipt</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Bill To</h3>
            <p className="font-medium text-lg">{order.customers.customer_name}</p>
          </div>

          <div className="text-right mb-6">
            <span className="font-semibold">Order Date : </span>
            {format(new Date(order.order_date), "dd MMM yyyy")}
            {order.due_date && (
              <div className="mt-1">
                <span className="font-semibold">Due Date : </span>
                {format(new Date(order.due_date), "dd MMM yyyy")}
              </div>
            )}
            {order.payment_terms && (
              <div className="mt-1">
                <span className="font-semibold">Payment Terms : </span>
                {order.payment_terms}
              </div>
            )}
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2">
                <th className="text-left py-2 w-12">#</th>
                <th className="text-left py-2">Item & Description</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Rate</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="py-3 text-left">{index + 1}</td>
                  <td className="py-3">{item.item_name}</td>
                  <td className="text-right py-3">
                    {isInvoice ? item.quantity : item.quantity_ordered}
                  </td>
                  <td className="text-right py-3">$0.00</td>
                  <td className="text-right py-3">$0.00</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span>Sub Total:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 font-bold text-lg">
                <span>Total:</span>
                <span>$0.00</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-1">Notes:</p>
              <p className="text-sm whitespace-pre-line">{order.notes}</p>
            </div>
          )}

          <div className="mt-8 text-center space-y-2">
            <p className="text-sm font-semibold">Nonprofit Tax-Deductible Donation</p>
            <p className="text-sm text-muted-foreground">
              All items are provided at no cost as part of our charitable mission.
            </p>
            <p className="text-sm text-muted-foreground">
              Thank you for supporting our community!
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:border-0, .print\\:border-0 * {
            visibility: visible;
          }
          .print\\:border-0 {
            position: absolute;
            left: 0;
            top: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
