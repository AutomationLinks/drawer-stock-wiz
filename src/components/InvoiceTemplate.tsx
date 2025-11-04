import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { format } from "date-fns";
import logo from "@/assets/goodwish-logo-horizontal.png";

interface InvoiceTemplateProps {
  order: {
    sales_order_number: string;
    order_date: string;
    payment_terms: string;
    subtotal: number;
    total: number;
    customers: { customer_name: string; billing_address: string };
    sales_order_items: Array<{
      item_name: string;
      quantity_ordered: number;
      item_price: number;
      item_total: number;
      usage_unit: string;
    }>;
  };
  onClose: () => void;
}

export const InvoiceTemplate = ({ order, onClose }: InvoiceTemplateProps) => {
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
            <img src={logo} alt="Logo" className="h-16" />
            <div className="text-right">
              <h1 className="text-3xl font-bold">INVOICE</h1>
              <p className="text-muted-foreground">{order.sales_order_number}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-2">Bill To:</h3>
              <p className="font-medium">{order.customers.customer_name}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {order.customers.billing_address}
              </p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <span className="font-semibold">Invoice Date: </span>
                {format(new Date(order.order_date), "MMM dd, yyyy")}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Payment Terms: </span>
                {order.payment_terms}
              </div>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2">
                <th className="text-left py-2">Item Description</th>
                <th className="text-right py-2">Quantity</th>
                <th className="text-right py-2">Rate</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.sales_order_items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">{item.item_name}</td>
                  <td className="text-right py-3">
                    {item.quantity_ordered} {item.usage_unit}
                  </td>
                  <td className="text-right py-3">${Number(item.item_price).toFixed(2)}</td>
                  <td className="text-right py-3">${Number(item.item_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span>Subtotal:</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 font-bold text-lg">
                <span>Total:</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-muted-foreground text-sm">
            <p>Thank you for your business!</p>
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
