import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export const VolunteerSchedule = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ["volunteer-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (slots_filled: number, capacity: number) => {
    if (slots_filled >= capacity) {
      return <Badge variant="destructive">Full</Badge>;
    } else if (slots_filled >= capacity - 2) {
      return <Badge className="bg-orange-500">Almost Full</Badge>;
    } else {
      return <Badge className="bg-green-500">Open</Badge>;
    }
  };

  const groupEventsByCategory = () => {
    if (!events) return {};

    return events.reduce((acc, event) => {
      const category = `${event.location} - ${event.time_slot}`;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(event);
      return acc;
    }, {} as Record<string, typeof events>);
  };

  if (isLoading) {
    return (
      <Card className="p-6 mb-8">
        <p className="text-center text-muted-foreground">Loading events...</p>
      </Card>
    );
  }

  const groupedEvents = groupEventsByCategory();

  return (
    <Card className="mb-8 p-6">
      <h2 className="text-2xl font-semibold mb-6">📆 2025 Volunteer Dates</h2>

      <div className="space-y-8">
        {Object.entries(groupedEvents).map(([category, categoryEvents]) => (
          <div key={category}>
            <h3 className="text-xl font-semibold mb-4">{category}</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Slots Filled</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {format(new Date(event.event_date), "MM/dd")}
                      </TableCell>
                      <TableCell>
                        {event.slots_filled}/{event.capacity}
                      </TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>
                        {getStatusBadge(event.slots_filled, event.capacity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
