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
import { format } from "date-fns";
import { CheckCircle2, Calendar, MapPin, Clock } from "lucide-react";
import { generateCalendarFile, downloadCalendarFile } from "@/utils/generateCalendarFile";

export const VolunteerSignupForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState("1");
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
  } | null>(null);

  const { data: events } = useQuery({
    queryKey: ["volunteer-events-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_events")
        .select("*")
        .gte("event_date", "2025-10-01")
        .lt("slots_filled", 10)
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (signupData: {
      event_id: string;
      first_name: string;
      last_name: string;
      email: string;
      quantity: number;
      comment?: string;
    }) => {
      const { error } = await supabase
        .from("volunteer_signups")
        .insert(signupData);

      if (error) throw error;
    },
    onSuccess: () => {
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
          quantity: parseInt(quantity),
        });
        setShowConfirmation(true);
      }
      
      // Refetch events to update available slots
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

    signupMutation.mutate({
      event_id: selectedEventId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      quantity: parseInt(quantity),
    });
  };

  const selectedEvent = events?.find((e) => e.id === selectedEventId);

  const handleAddToCalendar = () => {
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
    setQuantity("1");
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
            </p>
          </div>

          <Card className="p-6 bg-muted/50 text-left space-y-3">
            <h3 className="text-xl font-semibold mb-4">Event Details</h3>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-muted-foreground">
                  {format(new Date(confirmedSignup.eventDate), "EEEE, MMMM dd, yyyy")}
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
          </Card>

          <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <p className="text-sm font-medium">
              📧 Check your email for a confirmation message with a calendar invite!
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleAddToCalendar}
              size="lg"
              className="w-full h-14 text-lg"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Add to My Calendar
            </Button>
            
            <Button 
              onClick={handleSignUpAnother}
              variant="outline"
              size="lg"
              className="w-full h-14 text-lg"
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
    <Card className="p-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-3">Sign Up to Volunteer</h2>
        <p className="text-lg text-muted-foreground">
          Complete the form below to reserve your spot
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Event Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg">
              1
            </div>
            <Label htmlFor="event" className="text-xl font-semibold">Choose Your Date</Label>
          </div>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger id="event" className="h-14 text-lg">
              <SelectValue placeholder="Select a date and time" />
            </SelectTrigger>
            <SelectContent>
              {events?.map((event) => {
                const spotsLeft = event.capacity - event.slots_filled;
                return (
                  <SelectItem key={event.id} value={event.id} className="text-base py-3">
                    {format(new Date(event.event_date), "MMM dd, yy")} at {event.time_slot} ({spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left)
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
            <p className="text-base"><strong>Date:</strong> {format(new Date(selectedEvent.event_date), "MMMM dd, yyyy")}</p>
            <p className="text-base"><strong>Time:</strong> {selectedEvent.time_slot}</p>
            <p className="text-base"><strong>Location:</strong> {selectedEvent.location_address}</p>
            <p className="text-base"><strong>Available Spots:</strong> {selectedEvent.capacity - selectedEvent.slots_filled} / {selectedEvent.capacity}</p>
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

        <Button 
          type="submit" 
          className="w-full h-16 text-xl font-bold bg-accent hover:bg-accent/90"
          disabled={signupMutation.isPending}
        >
          {signupMutation.isPending ? "Signing Up..." : "Complete Sign Up →"}
        </Button>
      </form>
    </Card>
  );
};
