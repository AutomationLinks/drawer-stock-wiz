import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Download, Search, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VolunteerSignup {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  quantity: number;
  comment: string | null;
  created_at: string;
  volunteer_events: {
    event_date: string;
    time_slot: string;
    location: string;
    location_address: string;
  };
}

const VolunteerSignups = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "upcoming" | "past">("all");

  const { data: signups, isLoading } = useQuery({
    queryKey: ["volunteer-signups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_signups")
        .select(`
          *,
          volunteer_events (
            event_date,
            time_slot,
            location,
            location_address
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VolunteerSignup[];
    },
  });

  const filteredSignups = signups?.filter((signup) => {
    const matchesSearch =
      signup.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signup.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signup.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (dateFilter === "all") return matchesSearch;

    const eventDate = parseISO(signup.volunteer_events.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === "upcoming") {
      return matchesSearch && eventDate >= today;
    } else {
      return matchesSearch && eventDate < today;
    }
  });

  const exportToCSV = () => {
    if (!filteredSignups || filteredSignups.length === 0) {
      toast({
        title: "No Data",
        description: "There are no signups to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Event Date",
      "Time Slot",
      "Location",
      "Address",
      "Number of People",
      "Comment",
      "Signed Up On",
    ];

    const rows = filteredSignups.map((signup) => [
      signup.first_name,
      signup.last_name,
      signup.email,
      format(parseISO(signup.volunteer_events.event_date), "MM/dd/yyyy"),
      signup.volunteer_events.time_slot,
      signup.volunteer_events.location,
      signup.volunteer_events.location_address,
      signup.quantity.toString(),
      signup.comment || "",
      format(new Date(signup.created_at), "MM/dd/yyyy hh:mm a"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `volunteer-signups-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredSignups.length} signups to CSV.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Volunteer Signups Management</h1>
          <p className="text-muted-foreground">
            View and export all volunteer registrations
          </p>
        </div>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={dateFilter === "all" ? "default" : "outline"}
                onClick={() => setDateFilter("all")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={dateFilter === "upcoming" ? "default" : "outline"}
                onClick={() => setDateFilter("upcoming")}
                size="sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Upcoming
              </Button>
              <Button
                variant={dateFilter === "past" ? "default" : "outline"}
                onClick={() => setDateFilter("past")}
                size="sm"
              >
                Past
              </Button>
            </div>
            <Button onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            Showing {filteredSignups?.length || 0} signups
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">People</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Signed Up On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading signups...
                    </TableCell>
                  </TableRow>
                ) : filteredSignups && filteredSignups.length > 0 ? (
                  filteredSignups.map((signup) => (
                    <TableRow key={signup.id}>
                      <TableCell className="font-medium">
                        {signup.first_name} {signup.last_name}
                      </TableCell>
                      <TableCell>{signup.email}</TableCell>
                      <TableCell>
                        {format(
                          parseISO(signup.volunteer_events.event_date),
                          "MMM dd, yyyy"
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {signup.volunteer_events.time_slot}
                      </TableCell>
                      <TableCell>{signup.volunteer_events.location}</TableCell>
                      <TableCell className="text-center">
                        {signup.quantity}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {signup.comment || "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(
                          new Date(signup.created_at),
                          "MM/dd/yy hh:mm a"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No signups found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VolunteerSignups;
