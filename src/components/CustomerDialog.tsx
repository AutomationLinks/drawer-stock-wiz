import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CustomerDialog = ({ open, onOpenChange, onSuccess }: CustomerDialogProps) => {
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!customerId || !customerName) {
      toast({ title: "Error", description: "Customer ID and Name are required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("customers").insert({
      customer_id: customerId,
      customer_name: customerName,
      email,
      phone,
      billing_address: billingAddress,
      shipping_address: shippingAddress,
    });

    if (error) {
      toast({ title: "Error creating customer", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Customer created successfully" });
    onSuccess();
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerId("");
    setCustomerName("");
    setEmail("");
    setPhone("");
    setBillingAddress("");
    setShippingAddress("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Customer ID *</Label>
            <Input
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="CUST-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Customer Name *</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Company Name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Billing Address</Label>
            <Textarea
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="Enter billing address"
            />
          </div>

          <div className="space-y-2">
            <Label>Shipping Address</Label>
            <Textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Enter shipping address"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Customer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
