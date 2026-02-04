import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format, parseISO } from "date-fns";
import { Plus, Pencil, Trash2, Calendar, Clock, Users, Ticket, ChevronDown, Settings, Link, Check } from "lucide-react";
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
  requires_payment: boolean;
  ticket_price: number | null;
  ticket_purchase_url: string | null;
}

const VolunteerEvents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<VolunteerEvent | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  
  // Filter toggles
  const [showRegular, setShowRegular] = useState(true);
  const [showSpecial, setShowSpecial] = useState(true);
  const [showTicket, setShowTicket] = useState(true);
  
  // Webhook settings
  const [webhookSettingsOpen, setWebhookSettingsOpen] = useState(false);
  const [ticketWebhookUrl, setTicketWebhookUrl] = useState("");
  const [webhookSaved, setWebhookSaved] = useState(false);
  
  // Load webhook URL from localStorage on mount, with default
  const DEFAULT_TICKET_WEBHOOK = "https://hooks.zapier.com/hooks/catch/5173835/uqelrlo/";
  
  useEffect(() => {
    const savedWebhookUrl = localStorage.getItem("zapier_ticket_webhook_url");
    if (savedWebhookUrl) {
      setTicketWebhookUrl(savedWebhookUrl);
    } else {
      // Set default webhook and save it
      setTicketWebhookUrl(DEFAULT_TICKET_WEBHOOK);
      localStorage.setItem("zapier_ticket_webhook_url", DEFAULT_TICKET_WEBHOOK);
    }
  }, []);
  
  const handleSaveWebhook = () => {
    localStorage.setItem("zapier_ticket_webhook_url", ticketWebhookUrl);
    setWebhookSaved(true);
    toast({
      title: "Webhook saved",
      description: "Your Zapier webhook URL has been saved.",
    });
    setTimeout(() => setWebhookSaved(false), 2000);
  };
  
  const [formData, setFormData] = useState({
    event_date: "",
    time_slot: "",
    location: "",
    location_address: "",
    capacity: "10",
    event_type: "regular",
    event_name: "",
    requires_payment: false,
    ticket_price: "",
    ticket_purchase_url: "",
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

  // Calculate summary counts
  const summaryCounts = useMemo(() => {
    if (!events) return { total: 0, regular: 0, special: 0, ticket: 0 };
    
    return {
      total: events.length,
      regular: events.filter(e => e.event_type === "regular" && !e.requires_payment).length,
      special: events.filter(e => e.event_type === "event" && !e.requires_payment).length,
      ticket: events.filter(e => e.requires_payment).length,
    };
  }, [events]);

  // Filter events based on toggles
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    return events.filter(event => {
      if (event.requires_payment) return showTicket;
      if (event.event_type === "event") return showSpecial;
      return showRegular;
    });
  }, [events, showRegular, showSpecial, showTicket]);

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
          requires_payment: data.requires_payment,
          ticket_price: data.requires_payment && data.ticket_price ? parseFloat(data.ticket_price) : null,
          ticket_purchase_url: data.requires_payment ? data.ticket_purchase_url : null,
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
          requires_payment: data.requires_payment,
          ticket_price: data.requires_payment && data.ticket_price ? parseFloat(data.ticket_price) : null,
          ticket_purchase_url: data.requires_payment ? data.ticket_purchase_url : null,
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
      requires_payment: false,
      ticket_price: "",
      ticket_purchase_url: "",
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
        requires_payment: event.requires_payment || false,
        ticket_price: event.ticket_price?.toString() || "",
        ticket_purchase_url: event.ticket_purchase_url || "",
      });
    } else {
      setEditingEvent(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  // Quick-add templates
  const handleQuickAdd = (template: "knob" | "special" | "ticket" | "custom") => {
    resetForm();
    setEditingEvent(null);
    
    switch (template) {
      case "knob":
        setFormData({
          event_date: "",
          time_slot: "10:00 AM – 12:00 PM",
          location: "Burnsville",
          location_address: "500 E Travelers Trail Suite 575, Burnsville, MN 55337",
          capacity: "10",
          event_type: "regular",
          event_name: "Drawer Knob Hours",
          requires_payment: false,
          ticket_price: "",
          ticket_purchase_url: "",
        });
        break;
      case "special":
        setFormData({
          event_date: "",
          time_slot: "",
          location: "",
          location_address: "",
          capacity: "50",
          event_type: "event",
          event_name: "",
          requires_payment: false,
          ticket_price: "",
          ticket_purchase_url: "",
        });
        break;
      case "ticket":
        setFormData({
          event_date: "",
          time_slot: "",
          location: "",
          location_address: "",
          capacity: "50",
          event_type: "event",
          event_name: "",
          requires_payment: true,
          ticket_price: "",
          ticket_purchase_url: "",
        });
        break;
      default:
        // Custom - use default form
        break;
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

  const getEventTypeBadge = (event: VolunteerEvent) => {
    if (event.requires_payment) {
      return <Badge className="bg-amber-500 text-white">🟡 Ticket</Badge>;
    }
    if (event.event_type === "event") {
      return <Badge className="bg-green-500 text-white">🟢 Special</Badge>;
    }
    return <Badge className="bg-blue-500 text-white">🔵 Regular</Badge>;
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
          
          {/* Quick-Add Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Event
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleQuickAdd("knob")} className="gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Add Knob Hours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAdd("special")} className="gap-2">
                <Users className="h-4 w-4 text-green-500" />
                Add Special Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAdd("ticket")} className="gap-2">
                <Ticket className="h-4 w-4 text-amber-500" />
                Add Ticket Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAdd("custom")} className="gap-2">
                <Calendar className="h-4 w-4" />
                Custom Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{summaryCounts.total}</p>
            <p className="text-sm text-muted-foreground">Total Events</p>
          </Card>
          <Card className="p-4 text-center border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-3xl font-bold text-blue-600">{summaryCounts.regular}</p>
            <p className="text-sm text-muted-foreground">Knob Hours</p>
          </Card>
          <Card className="p-4 text-center border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-bold text-green-600">{summaryCounts.special}</p>
            <p className="text-sm text-muted-foreground">Special Events</p>
          </Card>
          <Card className="p-4 text-center border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <Ticket className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-3xl font-bold text-amber-600">{summaryCounts.ticket}</p>
            <p className="text-sm text-muted-foreground">Ticket Events</p>
          </Card>
        </div>

        {/* Filter Toggles */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-6 items-center">
            <span className="text-sm font-medium text-muted-foreground">Show:</span>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="show-regular" 
                checked={showRegular} 
                onCheckedChange={(checked) => setShowRegular(checked as boolean)}
              />
              <label htmlFor="show-regular" className="text-sm flex items-center gap-1 cursor-pointer">
                <Badge className="bg-blue-500 text-white text-xs">🔵</Badge>
                Knob Hours ({summaryCounts.regular})
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="show-special" 
                checked={showSpecial} 
                onCheckedChange={(checked) => setShowSpecial(checked as boolean)}
              />
              <label htmlFor="show-special" className="text-sm flex items-center gap-1 cursor-pointer">
                <Badge className="bg-green-500 text-white text-xs">🟢</Badge>
                Special Events ({summaryCounts.special})
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="show-ticket" 
                checked={showTicket} 
                onCheckedChange={(checked) => setShowTicket(checked as boolean)}
              />
              <label htmlFor="show-ticket" className="text-sm flex items-center gap-1 cursor-pointer">
                <Badge className="bg-amber-500 text-white text-xs">🟡</Badge>
                Ticket Events ({summaryCounts.ticket})
              </label>
            </div>
          </div>
        </Card>

        {/* Webhook Settings */}
        <Collapsible
          open={webhookSettingsOpen}
          onOpenChange={setWebhookSettingsOpen}
          className="mb-6"
        >
          <Card className="p-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Webhook Settings</span>
                  {ticketWebhookUrl && (
                    <Badge variant="secondary" className="ml-2">
                      <Check className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${webhookSettingsOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket_webhook_url" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Zapier Webhook URL (Ticket Purchases)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enter your Zapier webhook URL to receive notifications when someone purchases a ticket.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="ticket_webhook_url"
                      type="url"
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      value={ticketWebhookUrl}
                      onChange={(e) => setTicketWebhookUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleSaveWebhook} disabled={webhookSaved}>
                      {webhookSaved ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Saved
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

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
                ) : filteredEvents && filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        {format(parseISO(event.event_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {event.time_slot}
                      </TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>
                        {getEventTypeBadge(event)}
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
                placeholder="500 E Travelers Trail Suite 575, Burnsville, MN 55337"
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
                  <SelectItem value="regular">Regular Volunteer Shift</SelectItem>
                  <SelectItem value="event">Special Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_name">
                Event/Shift Name {formData.event_type === 'event' ? '*' : '(Optional)'}
              </Label>
              <Input
                id="event_name"
                placeholder={formData.event_type === 'event' 
                  ? "e.g., Holiday Gift Wrapping" 
                  : "e.g., Drawer Knob Hours, Care Pair Shift"}
                value={formData.event_name}
                onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                required={formData.event_type === 'event'}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_payment"
                  checked={formData.requires_payment}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_payment: checked as boolean })}
                />
                <Label htmlFor="requires_payment" className="cursor-pointer">
                  This event requires a ticket purchase
                </Label>
              </div>

              {formData.requires_payment && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="ticket_price">Ticket Price ($) *</Label>
                    <Input
                      id="ticket_price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="25.00"
                      value={formData.ticket_price}
                      onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
                      required={formData.requires_payment}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket_purchase_url">Stripe Payment Link *</Label>
                    <Input
                      id="ticket_purchase_url"
                      type="url"
                      placeholder="https://buy.stripe.com/..."
                      value={formData.ticket_purchase_url}
                      onChange={(e) => setFormData({ ...formData, ticket_purchase_url: e.target.value })}
                      required={formData.requires_payment}
                    />
                  </div>
                </div>
              )}
            </div>

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
                {editingEvent ? "Save Changes" : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
              Any existing signups for this event will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEventId && deleteMutation.mutate(deleteEventId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VolunteerEvents;
