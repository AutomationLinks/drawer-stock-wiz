import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const VolunteerSignupForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [comment, setComment] = useState("");

  const { data: events } = useQuery({
    queryKey: ["volunteer-events-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_events")
        .select("*")
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
      toast({
        title: "Success!",
        description: "Thank you for signing up! You'll receive a confirmation email shortly.",
      });
      
      // Reset form
      setSelectedEventId("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setQuantity("1");
      setComment("");
      
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
      comment: comment || undefined,
    });
  };

  const selectedEvent = events?.find((e) => e.id === selectedEventId);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">✍️ Sign Up to Volunteer</h2>
      <p className="text-muted-foreground mb-6">
        Choose your preferred date and location below. Each session holds up to 10 volunteers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Selection */}
        <div className="space-y-2">
          <Label htmlFor="event">Select Your Volunteer Date *</Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger id="event">
              <SelectValue placeholder="Choose a date" />
            </SelectTrigger>
            <SelectContent>
              {events?.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {format(new Date(event.event_date), "MMM dd, yyyy")} - {event.time_slot} ({event.location}) - {10 - event.slots_filled} spots left
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Show selected event details */}
        {selectedEvent && (
          <div className="bg-muted p-4 rounded-lg space-y-1">
            <p><strong>Location:</strong> {selectedEvent.location_address}</p>
            <p><strong>Time:</strong> {selectedEvent.time_slot}</p>
            <p><strong>Available Spots:</strong> {selectedEvent.capacity - selectedEvent.slots_filled} / {selectedEvent.capacity}</p>
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Number of Participants (1-10) *</Label>
          <Select value={quantity} onValueChange={setQuantity}>
            <SelectTrigger id="quantity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="font-semibold">Your Information</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Who are you volunteering with? (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter any additional information..."
              rows={3}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-[#69bf1f] hover:bg-[#5aa619]"
          size="lg"
          disabled={signupMutation.isPending}
        >
          {signupMutation.isPending ? "Signing Up..." : "Sign Me Up"}
        </Button>
      </form>
    </Card>
  );
};
