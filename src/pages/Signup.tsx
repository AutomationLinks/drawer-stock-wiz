import { Card } from "@/components/ui/card";
import { VolunteerSignupForm } from "@/components/VolunteerSignupForm";
import { DonationCounter } from "@/components/DonationCounter";
import { Header } from "@/components/Header";
const Signup = () => {
  return <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <DonationCounter />
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Volunteer With Us
          </h1>
          <p className="text-xl text-muted-foreground">
            Join us in making a difference! Sign up for an upcoming volunteer session.
          </p>
        </div>

        {/* Simplified Event Information */}
        <Card className="mb-8 p-8 text-lg">
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-xl mb-2">📍 Location</p>
              <p className="text-muted-foreground">500 E Travelers Trail Suite 575 Burnsville, MN 55337</p>
            </div>
            
            <div>
              <p className="font-semibold text-xl mb-2">🕙 Time Slots</p>
              <p className="text-muted-foreground">Mondays: 10:00 AM – 12:00 PM</p>
              <p className="text-muted-foreground">Thursdays: 5:00 PM – 6:30 PM</p>
            </div>
            
            <div>
              <p className="font-semibold text-xl mb-2">👥 Group Size</p>
              <p className="text-muted-foreground">Up to 10 volunteers per session</p>
            </div>
          </div>
        </Card>

        {/* Signup Form */}
        <VolunteerSignupForm />
      </div>
    </div>;
};
export default Signup;