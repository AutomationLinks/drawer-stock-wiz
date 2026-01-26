import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Calendar, MapPin, Clock, Download, ExternalLink, Users } from "lucide-react";
import { generateCalendarFile, downloadCalendarFile } from "@/utils/generateCalendarFile";
import { generateGoogleCalendarUrl, generateOutlookCalendarUrl } from "@/utils/calendarLinks";
import { Badge } from "@/components/ui/badge";

type FilterType = "all" | "regular" | "event" | "ticket";

interface VolunteerSignupFormProps {
  onSuccess?: () => void;
  showOnlyEventType?: "regular" | "event";
  filterType?: FilterType;
}

interface Attendee {
  firstName: string;
  lastName: string;
}

export const VolunteerSignupForm = ({ onSuccess, showOnlyEventType, filterType = "all" }: VolunteerSignupFormProps = {}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [additionalAttendees, setAdditionalAttendees] = useState<Attendee[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedSignup, setConfirmedSignup] = useState<{
    eventDate: string;
    timeSlot: string;
    location: string;
    locationAddress: string;
    firstName: string;
    lastName: string;
    email: string;
    quantity: number;
    attendees: Attendee[];
    eventName?: string | null;
  } | null>(null);

  const { data: events } = useQuery({
    queryKey: ["volunteer-events-available", showOnlyEventType, filterType],
    queryFn: async () => {
      let query = supabase
        .from("volunteer_events")
        .select("*")
        .gte("event_date", "2025-10-01");
      
      // Legacy prop support
      if (showOnlyEventType) {
        query = query.eq("event_type", showOnlyEventType);
      } 
      // New filter type support
      else if (filterType === "regular") {
        query = query.eq("event_type", "regular");
      } else if (filterType === "event") {
        query = query.eq("event_type", "event").eq("requires_payment", false);
      } else if (filterType === "ticket") {
        query = query.eq("requires_payment", true);
      }
      // "all" shows everything
      
      const { data, error } = await query.order("event_date", { ascending: true });

      if (error) throw error;
      
      // Filter client-side: only show events with available capacity
      return data?.filter(event => event.slots_filled < event.capacity) || [];
    },
  });

  const getEventBadge = (event: any) => {
    if (event.requires_payment) {
      return <Badge className="bg-amber-500 text-white text-xs">🟡 Ticket</Badge>;
    }
    if (event.event_type === "event") {
      return <Badge className="bg-green-500 text-white text-xs">🟢 Special</Badge>;
    }
    return <Badge className="bg-blue-500 text-white text-xs">🔵 Regular</Badge>;
  };

  const getEventDisplayName = (event: any) => {
    if (event.event_name) {
      return event.event_name;
    }
    return `${event.location} - ${event.time_slot}`;
  };

  const signupMutation = useMutation({
    mutationFn: async (signupData: {
      event_id: string;
      first_name: string;
      last_name: string;
      email: string;
      quantity: number;
      comment?: string;
      attendees: Attendee[];
    }) => {
      // Insert main signup
      const { data: signup, error: signupError } = await supabase
        .from("volunteer_signups")
        .insert({
          event_id: signupData.event_id,
          first_name: signupData.first_name,
          last_name: signupData.last_name,
          email: signupData.email,
          quantity: signupData.quantity,
          comment: signupData.comment,
        })
        .select()
        .single();

      if (signupError) throw signupError;

      // Insert additional attendees if any
      if (signupData.attendees.length > 0) {
        const attendeesData = signupData.attendees.map(att => ({
          signup_id: signup.id,
          first_name: att.firstName,
          last_name: att.lastName,
        }));

        const { error: attendeesError } = await supabase
          .from("volunteer_signup_attendees")
          .insert(attendeesData);

        if (attendeesError) throw attendeesError;
      }

      return signup;
    },
    onSuccess: async () => {
      const event = events?.find((e) => e.id === selectedEventId);
      if (event) {
        setConfirmedSignup({
          eventDate: event.event_date,
          timeSlot: event.time_slot,
          location: event.location,
          locationAddress: event.location_address,
          firstName,
          lastName,
          email,
          quantity,
          attendees: additionalAttendees,
          eventName: event.event_name,
        });
        setShowConfirmation(true);
        
        // Trigger Zapier webhook for ticket events
        if (event.requires_payment) {
          const webhookUrl = localStorage.getItem("zapier_ticket_webhook_url");
          if (webhookUrl) {
            try {
              await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                mode: "no-cors",
                body: JSON.stringify({
                  type: "ticket_purchase",
                  event_name: event.event_name || event.location,
                  event_date: event.event_date,
                  event_time: event.time_slot,
                  location: event.location,
                  location_address: event.location_address,
                  ticket_price: event.ticket_price,
                  first_name: firstName,
                  last_name: lastName,
                  email: email,
                  quantity: quantity,
                  total_amount: (event.ticket_price || 0) * quantity,
                  timestamp: new Date().toISOString(),
                }),
              });
              console.log("Ticket webhook triggered successfully");
            } catch (error) {
              console.error("Failed to trigger ticket webhook:", error);
            }
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["volunteer-events"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-events-available"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to sign up. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    // Adjust attendees array to match quantity - 1 (excluding primary person)
    const additionalCount = newQuantity - 1;
    if (additionalCount > additionalAttendees.length) {
      // Add empty attendee slots
      const newAttendees = [...additionalAttendees];
      for (let i = additionalAttendees.length; i < additionalCount; i++) {
        newAttendees.push({ firstName: "", lastName: "" });
      }
      setAdditionalAttendees(newAttendees);
    } else if (additionalCount < additionalAttendees.length) {
      // Remove extra attendee slots
      setAdditionalAttendees(additionalAttendees.slice(0, additionalCount));
    }
  };

  const updateAttendee = (index: number, field: "firstName" | "lastName", value: string) => {
    const updated = [...additionalAttendees];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalAttendees(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEventId || !firstName || !lastName || !email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate additional attendees have names
    if (quantity > 1) {
      const missingNames = additionalAttendees.some(att => !att.firstName || !att.lastName);
      if (missingNames) {
        toast({
          title: "Missing Attendee Names",
          description: "Please provide names for all people in your group.",
          variant: "destructive",
        });
        return;
      }
    }

    signupMutation.mutate({
      event_id: selectedEventId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      quantity: quantity,
      attendees: additionalAttendees,
    });
  };

  const selectedEvent = events?.find((e) => e.id === selectedEventId);
  const availableSpots = selectedEvent ? selectedEvent.capacity - selectedEvent.slots_filled : 0;

  const handleAddToGoogleCalendar = () => {
    if (!confirmedSignup) return;
    
    const url = generateGoogleCalendarUrl(
      confirmedSignup.eventDate,
      confirmedSignup.timeSlot,
      confirmedSignup.location,
      confirmedSignup.locationAddress
    );
    
    window.open(url, '_blank');
  };

  const handleAddToOutlook = () => {
    if (!confirmedSignup) return;
    
    const url = generateOutlookCalendarUrl(
      confirmedSignup.eventDate,
      confirmedSignup.timeSlot,
      confirmedSignup.location,
      confirmedSignup.locationAddress
    );
    
    window.open(url, '_blank');
  };

  const handleDownloadICS = () => {
    if (!confirmedSignup) return;
    
    const icsContent = generateCalendarFile(
      confirmedSignup.eventDate,
      confirmedSignup.timeSlot,
      confirmedSignup.location,
      confirmedSignup.locationAddress,
      confirmedSignup.email,
      `${confirmedSignup.firstName} ${confirmedSignup.lastName}`
    );
    
    downloadCalendarFile(icsContent);
    
    toast({
      title: "Calendar File Downloaded",
      description: "Open the file to add this event to your calendar.",
    });
  };

  const handleSignUpAnother = () => {
    setShowConfirmation(false);
    setConfirmedSignup(null);
    setSelectedEventId("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setQuantity(1);
    setAdditionalAttendees([]);
  };

  if (showConfirmation && confirmedSignup) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-3">You're All Set!</h2>
            <p className="text-lg text-muted-foreground">
              Thank you for signing up to volunteer, {confirmedSignup.firstName}!
              {confirmedSignup.quantity > 1 && (
                <span> Your group of {confirmedSignup.quantity} is confirmed.</span>
              )}
            </p>
          </div>

          <Card className="p-6 bg-muted/50 text-left space-y-3">
            <h3 className="text-xl font-semibold mb-4">Event Details</h3>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-muted-foreground">
                  {format(parseISO(confirmedSignup.eventDate), "EEEE, MMMM dd, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-muted-foreground">{confirmedSignup.timeSlot}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">
                  {confirmedSignup.location}<br />
                  {confirmedSignup.locationAddress}
                </p>
              </div>
            </div>
            {confirmedSignup.quantity > 1 && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Your Group ({confirmedSignup.quantity} people)</p>
                  <ul className="text-muted-foreground list-disc list-inside">
                    <li>{confirmedSignup.firstName} {confirmedSignup.lastName} (you)</li>
                    {confirmedSignup.attendees.map((att, i) => (
                      <li key={i}>{att.firstName} {att.lastName}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>

          <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <p className="text-sm font-medium">
              📧 Check your email for a confirmation message with a calendar invite!
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={handleAddToGoogleCalendar}
                size="lg"
                className="h-14 text-base"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Google Calendar
              </Button>
              
              <Button 
                onClick={handleAddToOutlook}
                size="lg"
                variant="secondary"
                className="h-14 text-base"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Outlook
              </Button>
              
              <Button 
                onClick={handleDownloadICS}
                size="lg"
                variant="outline"
                className="h-14 text-base"
              >
                <Download className="h-5 w-5 mr-2" />
                Download .ics
              </Button>
            </div>
            
            {selectedEvent && (selectedEvent as any).requires_payment && (selectedEvent as any).ticket_purchase_url && (
              <div className="mt-4 p-4 border-2 border-primary rounded-lg bg-primary/5">
                <h4 className="font-semibold text-lg mb-2">Complete Your Registration</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  This event requires a ticket purchase of ${(selectedEvent as any).ticket_price} to confirm your registration.
                </p>
                <Button
                  className="w-full h-12"
                  onClick={() => window.open((selectedEvent as any).ticket_purchase_url, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Purchase Ticket (${(selectedEvent as any).ticket_price})
                </Button>
              </div>
            )}
            
            <Button 
              onClick={handleSignUpAnother}
              variant="outline"
              size="lg"
              className="w-full h-14 text-lg mt-4"
            >
              Sign Up Another Person
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Please arrive 10 minutes early. Questions? Call us at 877-829-5500
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-8 overflow-visible">
      <div className="mb-6 sm:mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Sign Up to Volunteer</h2>
        <p className="text-base sm:text-lg text-muted-foreground">
          Complete the form below to reserve your spot
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Step 1: Event Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg">
              1
            </div>
            <Label htmlFor="event" className="text-xl font-semibold">Choose Your Date</Label>
          </div>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger id="event" className="min-h-14 h-auto text-lg py-3">
              <SelectValue placeholder="Select a date and time" />
            </SelectTrigger>
            <SelectContent>
              {events?.map((event) => {
                const spotsLeft = event.capacity - event.slots_filled;
                return (
                  <SelectItem key={event.id} value={event.id} className="text-base py-3">
                    <div className="flex items-center gap-2">
                      {getEventBadge(event)}
                        <span>
                          {format(parseISO(event.event_date), "MMM dd, yy")} – {getEventDisplayName(event)}
                          {event.event_name && ` - ${event.time_slot}`}
                          {` (${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'})`}
                        </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Show selected event details */}
        {selectedEvent && (
          <div className="bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 p-6 rounded-lg space-y-2">
            <p className="text-lg"><strong>✓ You selected:</strong></p>
            <p className="text-base"><strong>Date:</strong> {format(parseISO(selectedEvent.event_date), "MMMM dd, yyyy")}</p>
            <p className="text-base"><strong>Time:</strong> {selectedEvent.time_slot}</p>
            <p className="text-base"><strong>Location:</strong> {selectedEvent.location_address}</p>
            <p className="text-base"><strong>Available Spots:</strong> {availableSpots} / {selectedEvent.capacity}</p>
          </div>
        )}

        {/* Step 2: Personal Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg">
              2
            </div>
            <h3 className="text-xl font-semibold">Your Information</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-base">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="h-12 text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-base">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="h-12 text-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 text-lg"
            />
          </div>
        </div>

        {/* Step 3: Group Size */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg">
              3
            </div>
            <h3 className="text-xl font-semibold">Group Size</h3>
          </div>
          
          <div className="space-y-2">
            <Label className="text-base">How many people total (including yourself)?</Label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  type="button"
                  variant={quantity === num ? "default" : "outline"}
                  className={`h-12 w-12 text-lg ${quantity === num ? "" : ""}`}
                  onClick={() => handleQuantityChange(num)}
                  disabled={selectedEvent && num > availableSpots}
                >
                  {num}
                </Button>
              ))}
            </div>
            {selectedEvent && availableSpots < 5 && (
              <p className="text-sm text-muted-foreground">
                Maximum {availableSpots} {availableSpots === 1 ? 'person' : 'people'} available for this slot
              </p>
            )}
          </div>

          {/* Additional Attendees */}
          {quantity > 1 && (
            <div className="space-y-4 mt-4 p-4 bg-muted/50 rounded-lg border">
              <p className="font-medium text-base">Please provide names for everyone in your group:</p>
              
              <div className="p-3 bg-background rounded border">
                <p className="text-sm text-muted-foreground mb-1">Person 1 (You)</p>
                <p className="font-medium">{firstName || "..."} {lastName || "..."}</p>
              </div>
              
              {additionalAttendees.map((attendee, index) => (
                <div key={index} className="grid md:grid-cols-2 gap-3 p-3 bg-background rounded border">
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Person {index + 2}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">First Name *</Label>
                    <Input
                      value={attendee.firstName}
                      onChange={(e) => updateAttendee(index, "firstName", e.target.value)}
                      placeholder="First name"
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Last Name *</Label>
                    <Input
                      value={attendee.lastName}
                      onChange={(e) => updateAttendee(index, "lastName", e.target.value)}
                      placeholder="Last name"
                      className="h-10"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full h-16 text-xl font-bold bg-accent hover:bg-accent/90"
          disabled={signupMutation.isPending}
        >
          {signupMutation.isPending ? "Signing Up..." : `Complete Sign Up${quantity > 1 ? ` (${quantity} people)` : ""} →`}
        </Button>
      </form>
    </Card>
  );
};
