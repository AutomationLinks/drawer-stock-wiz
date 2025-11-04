import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DonorDialogProps {
  donor: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export const DonorDialog = ({ donor, open, onOpenChange, onSave }: DonorDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    organization: "",
    amount: "",
    frequency: "one-time",
    campaign: "",
    coupon_code: "",
    status: "completed",
  });

  useEffect(() => {
    if (donor) {
      setFormData({
        name: donor.name || "",
        email: donor.email || "",
        phone: donor.phone || "",
        address: donor.address || "",
        organization: donor.organization || "",
        amount: donor.amount?.toString() || "",
        frequency: donor.frequency || "one-time",
        campaign: donor.campaign || "",
        coupon_code: donor.coupon_code || "",
        status: donor.status || "completed",
      });
    }
  }, [donor]);

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      if (donor) {
        // Update existing donor
        const { error } = await supabase
          .from('donations')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address || null,
            organization: formData.organization || null,
            amount,
            total_amount: amount,
            frequency: formData.frequency,
            campaign: formData.campaign,
            coupon_code: formData.coupon_code || null,
            status: formData.status,
          })
          .eq('id', donor.id);

        if (error) throw error;
        toast.success("Donor updated successfully");
      } else {
        // Create new donor
        const { error } = await supabase.from('donations').insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address || null,
          organization: formData.organization || null,
          amount,
          processing_fee: 0,
          total_amount: amount,
          frequency: formData.frequency,
          campaign: formData.campaign,
          coupon_code: formData.coupon_code || null,
          status: formData.status,
          is_test_mode: false,
        });

        if (error) throw error;
        toast.success("Donor added successfully");
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving donor:', error);
      toast.error("Failed to save donor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{donor ? "Edit Donor" : "Add Donor"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-Time</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign *</Label>
              <Input
                id="campaign"
                value={formData.campaign}
                onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon">Coupon Code</Label>
              <Input
                id="coupon"
                value={formData.coupon_code}
                onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {donor && (
            <div className="text-xs text-muted-foreground space-y-1">
              {donor.stripe_customer_id && <p>Stripe Customer: {donor.stripe_customer_id}</p>}
              {donor.stripe_payment_intent_id && <p>Payment Intent: {donor.stripe_payment_intent_id}</p>}
              {donor.stripe_subscription_id && <p>Subscription: {donor.stripe_subscription_id}</p>}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              {donor ? "Update" : "Add"} Donor
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
