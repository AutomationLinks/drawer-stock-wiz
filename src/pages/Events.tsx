import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { VolunteerSignupForm } from "@/components/VolunteerSignupForm";

const Events = () => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["special-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_events")
        .select("*")
        .eq("event_type", "event")
        .gte("event_date", "2025-10-01")
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (selectedEventId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <VolunteerSignupForm
            onSuccess={() => setSelectedEventId(null)}
            showOnlyEventType="event"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Special Events</h1>
          <p className="text-muted-foreground">
            Join us for special volunteer events and community gatherings
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading events...
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const spotsLeft = event.capacity - event.slots_filled;
              const isFull = spotsLeft <= 0;
              const isPaid = event.requires_payment && event.ticket_price;

              return (
                <Card
                  key={event.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => !isFull && setSelectedEventId(event.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold flex-1">
                      {event.event_name || "Special Event"}
                    </h3>
                    {isPaid && (
                      <Badge variant="secondary" className="ml-2">
                        <DollarSign className="h-3 w-3 mr-1" />
                        ${event.ticket_price}
                      </Badge>
                    )}
                    {!isPaid && (
                      <Badge variant="outline" className="ml-2">
                        Free
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">
                          {format(parseISO(event.event_date), "EEEE, MMMM dd, yyyy")}
                        </div>
                        <div className="text-muted-foreground">{event.time_slot}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">{event.location}</div>
                        <div className="text-muted-foreground text-xs">
                          {event.location_address}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        {isFull ? (
                          <Badge variant="destructive">Event Full</Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} remaining
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    {isFull ? (
                      <div className="text-center text-muted-foreground text-sm">
                        This event is fully booked
                      </div>
                    ) : (
                      <div className="text-center text-primary text-sm font-medium">
                        Click to sign up →
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
            <p className="text-muted-foreground">
              Check back later for new special events and volunteer opportunities
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Events;
