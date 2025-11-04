import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Search, X } from "lucide-react";
import { PartnerDialog } from "./PartnerDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Partner {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
}

interface PartnersTableProps {
  partners: Partner[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  zipFilter: string;
  onZipFilterChange: (value: string) => void;
  onRowClick?: (partnerId: string) => void;
  selectedPartnerId?: string;
}

export const PartnersTable = ({
  partners,
  searchTerm,
  onSearchChange,
  zipFilter,
  onZipFilterChange,
  onRowClick,
  selectedPartnerId,
}: PartnersTableProps) => {
  const [editingPartner, setEditingPartner] = useState<Partner | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      !searchTerm ||
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.postal_code.includes(searchTerm);

    const matchesZip = !zipFilter || partner.postal_code.startsWith(zipFilter);

    return matchesSearch && matchesZip;
  });

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!partnerToDelete) return;

    try {
      const { error } = await supabase
        .from("partners")
        .delete()
        .eq("id", partnerToDelete);

      if (error) throw error;

      toast({
        title: "Partner Deleted",
        description: "Partner has been removed successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["partners"] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPartnerToDelete(null);
    }
  };

  const confirmDelete = (partnerId: string) => {
    setPartnerToDelete(partnerId);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, state, or zip..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => onSearchChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="relative w-48">
            <Input
              placeholder="Filter by zip code..."
              value={zipFilter}
              onChange={(e) => onZipFilterChange(e.target.value)}
            />
            {zipFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => onZipFilterChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Zip Code</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No partners found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartners.map((partner) => (
                  <TableRow
                    key={partner.id}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      selectedPartnerId === partner.id ? "bg-muted" : ""
                    }`}
                    onClick={() => onRowClick?.(partner.id)}
                  >
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.contact_name || "-"}</TableCell>
                    <TableCell>{partner.city || "-"}</TableCell>
                    <TableCell>{partner.state || "-"}</TableCell>
                    <TableCell>{partner.postal_code}</TableCell>
                    <TableCell>{partner.phone || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(partner);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(partner.id);
                          }}
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

        <div className="text-sm text-muted-foreground">
          Showing {filteredPartners.length} of {partners.length} partners
        </div>
      </div>

      <PartnerDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingPartner(undefined);
        }}
        partner={editingPartner}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the partner from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
