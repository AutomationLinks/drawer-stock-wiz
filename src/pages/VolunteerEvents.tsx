import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { format, parseISO } from "date-fns";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VolunteerEvent {
  id: string;
  event_date: string;
  time_slot: string;
  location: string;
  location_address: string;
  capacity: number;
  slots_filled: number;
  event_type: string;
  event_name: string | null;
}

const VolunteerEvents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<VolunteerEvent | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    event_date: "",
    time_slot: "",
    location: "",
    location_address: "",
    capacity: "10",
    event_type: "regular",
    event_name: "",
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["volunteer-events-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data as VolunteerEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("volunteer_events")
        .insert({
          event_date: data.event_date,
          time_slot: data.time_slot,
          location: data.location,
          location_address: data.location_address,
          capacity: parseInt(data.capacity),
          event_type: data.event_type,
          event_name: data.event_name || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-events-admin"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Volunteer event created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from("volunteer_events")
        .update({
          event_date: data.event_date,
          time_slot: data.time_slot,
          location: data.location,
          location_address: data.location_address,
          capacity: parseInt(data.capacity),
          event_type: data.event_type,
          event_name: data.event_name || null,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-events-admin"] });
      setIsDialogOpen(false);
      setEditingEvent(null);
      resetForm();
      toast({
        title: "Success",
        description: "Volunteer event updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("volunteer_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-events-admin"] });
      setDeleteEventId(null);
      toast({
        title: "Success",
        description: "Volunteer event deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({
      event_date: "",
      time_slot: "",
      location: "",
      location_address: "",
      capacity: "10",
      event_type: "regular",
      event_name: "",
    });
  };

  const handleOpenDialog = (event?: VolunteerEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        event_date: event.event_date,
        time_slot: event.time_slot,
        location: event.location,
        location_address: event.location_address,
        capacity: event.capacity.toString(),
        event_type: event.event_type,
        event_name: event.event_name || "",
      });
    } else {
      setEditingEvent(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEvent) {
      updateMutation.mutate({ ...formData, id: editingEvent.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Volunteer Events Management</h1>
            <p className="text-muted-foreground">
              Manage volunteer events and availability
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>

        <Card className="p-6">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead className="text-center">Capacity</TableHead>
                  <TableHead className="text-center">Filled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading events...
                    </TableCell>
                  </TableRow>
                ) : events && events.length > 0 ? (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        {format(parseISO(event.event_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {event.time_slot}
                      </TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>
                        <span className={event.event_type === 'event' ? 'font-semibold text-primary' : ''}>
                          {event.event_type === 'event' ? 'Special Event' : 'Regular Hours'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {event.event_name || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {event.capacity}
                      </TableCell>
                      <TableCell className="text-center">
                        {event.slots_filled}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(event)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteEventId(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No events found. Add your first event to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Volunteer Event" : "Add Volunteer Event"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent 
                ? "Update the event details below."
                : "Create a new volunteer event with the details below."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Event Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time_slot">Time Slot *</Label>
                <Input
                  id="time_slot"
                  placeholder="10:00 AM – 12:00 PM"
                  value={formData.time_slot}
                  onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="Burnsville"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_address">Location Address *</Label>
              <Input
                id="location_address"
                placeholder="501 Highway 13 East, Suite 575, Burnsville MN 55337"
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger id="event_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Hours (Drawer Knob)</SelectItem>
                  <SelectItem value="event">Special Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.event_type === 'event' && (
              <div className="space-y-2">
                <Label htmlFor="event_name">Event Name *</Label>
                <Input
                  id="event_name"
                  placeholder="Holiday Gift Wrapping"
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  required
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingEvent(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingEvent
                  ? "Update Event"
                  : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this volunteer event. If people have already signed up,
              they will still have their confirmations but the event won't appear in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEventId && deleteMutation.mutate(deleteEventId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VolunteerEvents;
