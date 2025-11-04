import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye, Edit, Trash2, Download, Search } from "lucide-react";
import { DonorDialog } from "./DonorDialog";
import { toast } from "sonner";

interface DonorsTableProps {
  showTestDonations: boolean;
}

export const DonorsTable = ({ showTestDonations }: DonorsTableProps) => {
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");

  const { data: donations = [], refetch } = useQuery({
    queryKey: ['donations', showTestDonations],
    queryFn: async () => {
      let query = supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!showTestDonations) {
        query = query.eq('is_test_mode', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('donations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donations'
        },
        () => {
          console.log('Donation change detected');
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const campaigns = Array.from(new Set(donations.map(d => d.campaign)));

  const filteredDonations = donations.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      (d.organization && d.organization.toLowerCase().includes(search.toLowerCase()));
    
    const matchesFrequency = frequencyFilter === "all" || d.frequency === frequencyFilter;
    const matchesCampaign = campaignFilter === "all" || d.campaign === campaignFilter;

    return matchesSearch && matchesFrequency && matchesCampaign;
  });

  const handleEdit = (donor: any) => {
    setSelectedDonor(donor);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this donor?")) return;

    const { error } = await supabase.from('donations').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete donor");
    } else {
      toast.success("Donor deleted successfully");
      refetch();
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Address', 'Organization', 'Amount', 'Frequency', 'Campaign', 'Coupon Code', 'Date', 'Status'],
      ...filteredDonations.map(d => [
        d.name,
        d.email,
        d.phone,
        d.address || '',
        d.organization || '',
        d.amount,
        d.frequency,
        d.campaign,
        d.coupon_code || '',
        new Date(d.created_at).toLocaleDateString(),
        d.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      cancelled: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frequencies</SelectItem>
            <SelectItem value="one-time">One-Time</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>

        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns.map(campaign => (
              <SelectItem key={campaign} value={campaign}>{campaign}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDonations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No donors found
                </TableCell>
              </TableRow>
            ) : (
              filteredDonations.map((donor) => (
                <TableRow key={donor.id}>
                  <TableCell className="font-medium">
                    {donor.name}
                    {donor.is_test_mode && (
                      <Badge variant="outline" className="ml-2 text-xs">TEST</Badge>
                    )}
                  </TableCell>
                  <TableCell>{donor.email}</TableCell>
                  <TableCell>{donor.phone}</TableCell>
                  <TableCell>{formatCurrency(donor.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={donor.frequency === "monthly" ? "default" : "secondary"}>
                      {donor.frequency}
                    </Badge>
                  </TableCell>
                  <TableCell>{donor.campaign}</TableCell>
                  <TableCell>{new Date(donor.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(donor.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(donor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(donor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DonorDialog
        donor={selectedDonor}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedDonor(null);
        }}
        onSave={refetch}
      />
    </div>
  );
};
