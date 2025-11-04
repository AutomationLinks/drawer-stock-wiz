import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    first_name: "",
    last_name: "",
    organization: "",
    address: "",
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
        first_name: donor.first_name || "",
        last_name: donor.last_name || "",
        organization: donor.organization || "",
        address: donor.address || "",
        amount: donor.amount?.toString() || "",
        frequency: donor.frequency || "one-time",
        campaign: donor.campaign || "",
        coupon_code: donor.coupon_code || "",
        status: donor.status || "completed",
      });
    }
  }, [donor]);

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const donationData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      organization: formData.organization || null,
      address: formData.address || null,
      amount: parseFloat(formData.amount),
      total_amount: parseFloat(formData.amount),
      processing_fee: 0,
      frequency: formData.frequency,
      campaign: formData.campaign,
      coupon_code: formData.coupon_code || null,
      status: formData.status,
    };

    if (donor) {
      const { error } = await supabase
        .from("donations")
        .update(donationData)
        .eq("id", donor.id);

      if (error) {
        toast.error("Failed to update donor");
        return;
      }
      toast.success("Donor updated successfully");
    } else {
      const { error } = await supabase.from("donations").insert(donationData);

      if (error) {
        toast.error("Failed to add donor");
        return;
      }
      toast.success("Donor added successfully");
    }

    onSave();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{donor ? "Edit Donor" : "Add Donor"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Smith"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="Acme Inc"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="555-123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, City, ST 12345"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="100.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <select
                id="frequency"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="one-time">One-time</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign</Label>
              <Input
                id="campaign"
                value={formData.campaign}
                onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                placeholder="General"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon_code">Coupon Code</Label>
              <Input
                id="coupon_code"
                value={formData.coupon_code}
                onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value })}
                placeholder="SAVE10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleSave} className="flex-1">
            {donor ? "Update Donor" : "Add Donor"}
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
