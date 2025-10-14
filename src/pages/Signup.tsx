import { Card } from "@/components/ui/card";
import { VolunteerSchedule } from "@/components/VolunteerSchedule";
import { VolunteerSignupForm } from "@/components/VolunteerSignupForm";

const Signup = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Drawer Knob Volunteer Events
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join us in making a difference! Sign up for upcoming volunteer sessions and help our community.
          </p>
        </div>

        {/* Event Information */}
        <Card className="mb-8 p-6">
          <h2 className="text-2xl font-semibold mb-4">📅 Event Schedule Overview</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">🕙 Standard Time Slots</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Mondays → 10:00 AM – 12:00 PM</li>
                <li>Thursdays → 5:00 PM – 6:30 PM</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">📍 Locations</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Burnsville:</strong> 501 Highway 13 East, Suite 575, Burnsville MN 55337</li>
                <li><strong>Eagan:</strong> 2935 West Service Road, Eagan MN</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              👥 <strong>Capacity:</strong> 10 volunteers per session
            </p>
          </div>
        </Card>

        {/* Event Schedule Table */}
        <VolunteerSchedule />

        {/* Signup Form */}
        <VolunteerSignupForm />
      </div>
    </div>
  );
};

export default Signup;
