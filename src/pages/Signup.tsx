import { useState } from "react";
import { Card } from "@/components/ui/card";
import { VolunteerSignupForm } from "@/components/VolunteerSignupForm";
import { DonationCounter } from "@/components/DonationCounter";
import { Header } from "@/components/Header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users } from "lucide-react";

type FilterType = "all" | "regular" | "event" | "ticket";

const Signup = () => {
  const [filterType, setFilterType] = useState<FilterType>("all");

  return (
    <div className="min-h-screen bg-background">
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

        {/* Category Filter Tabs */}
        <Card className="mb-6 p-4">
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
            <TabsList className="grid grid-cols-3 w-full h-auto">
              <TabsTrigger value="all" className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="h-5 w-5" />
                <span className="text-xs sm:text-sm">All</span>
              </TabsTrigger>
              <TabsTrigger value="regular" className="flex flex-col gap-1 py-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Clock className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Volunteer Hours</span>
              </TabsTrigger>
              <TabsTrigger value="event" className="flex flex-col gap-1 py-3 data-[state=active]:bg-green-500 data-[state=active]:text-white">
                <Users className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Special Events</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        {/* Filter Description */}
        <div className="mb-6 text-center">
          {filterType === "all" && (
            <p className="text-muted-foreground">Showing all volunteer opportunities</p>
          )}
          {filterType === "regular" && (
            <p className="text-blue-600 dark:text-blue-400 font-medium">🔵 Regular Volunteer Hours - Drawer Knob sessions</p>
          )}
          {filterType === "event" && (
            <p className="text-green-600 dark:text-green-400 font-medium">🟢 Special Events - One-time volunteer events</p>
          )}
        </div>

        {/* Simplified Event Information - only show for regular/all */}
        {(filterType === "all" || filterType === "regular") && (
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
        )}

        {/* Signup Form */}
        <VolunteerSignupForm filterType={filterType} />
      </div>
    </div>
  );
};

export default Signup;
