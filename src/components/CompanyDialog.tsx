import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  customer_id: string;
  customer_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  customer_sub_type?: string;
  billing_address?: string;
  shipping_address?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
  onSuccess: () => void;
}

export const CompanyDialog = ({ open, onOpenChange, company, onSuccess }: CompanyDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: company?.customer_id || "",
    customer_name: company?.customer_name || "",
    first_name: company?.first_name || "",
    last_name: company?.last_name || "",
    email: company?.email || "",
    phone: company?.phone || "",
    customer_sub_type: company?.customer_sub_type || "",
    billing_address: company?.billing_address || "",
    shipping_address: company?.shipping_address || "",
    address_line_1: company?.address_line_1 || "",
    address_line_2: company?.address_line_2 || "",
    city: company?.city || "",
    state: company?.state || "",
    postal_code: company?.postal_code || "",
    country: company?.country || "USA",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.customer_id) {
      toast({
        title: "Validation Error",
        description: "Company name and Contact ID are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (company) {
        // Update existing company
        const { error } = await supabase
          .from("customers")
          .update(formData)
          .eq("id", company.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Company updated successfully",
        });
      } else {
        // Check for duplicate customer_id
        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("customer_id", formData.customer_id)
          .single();

        if (existing) {
          toast({
            title: "Error",
            description: "A company with this Contact ID already exists",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Create new company
        const { error } = await supabase
          .from("customers")
          .insert(formData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Company created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? "Edit Company" : "Add Company"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_id">Contact ID *</Label>
              <Input
                id="customer_id"
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                placeholder="CUST-001"
                disabled={!!company}
                required
              />
            </div>
            <div>
              <Label htmlFor="customer_name">Company Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="ABC Corporation"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@abc.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="customer_sub_type">Customer Sub Type</Label>
            <Select
              value={formData.customer_sub_type}
              onValueChange={(value) => setFormData({ ...formData, customer_sub_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Partner">Partner</SelectItem>
                <SelectItem value="Client">Client</SelectItem>
                <SelectItem value="Vendor">Vendor</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="billing_address">Billing Address</Label>
            <Textarea
              id="billing_address"
              value={formData.billing_address}
              onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
              placeholder="123 Main St, City, State ZIP"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="shipping_address">Shipping Address</Label>
            <Textarea
              id="shipping_address"
              value={formData.shipping_address}
              onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
              placeholder="123 Main St, City, State ZIP"
              rows={2}
            />
          </div>

          <div className="col-span-2">
            <h3 className="text-lg font-semibold mb-4">Location</h3>
          </div>

          <div className="col-span-2">
            <Label htmlFor="address_line_1">Address Line 1</Label>
            <Input
              id="address_line_1"
              value={formData.address_line_1}
              onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
              placeholder="123 Main Street"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="address_line_2">Address Line 2</Label>
            <Input
              id="address_line_2"
              value={formData.address_line_2}
              onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
              placeholder="Suite 100"
            />
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Minneapolis"
            />
          </div>

          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="MN"
              maxLength={2}
            />
          </div>

          <div>
            <Label htmlFor="postal_code">Zip Code</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              placeholder="55401"
            />
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="USA"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : company ? "Update Company" : "Create Company"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
