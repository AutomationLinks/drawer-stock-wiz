import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Calendar } from "lucide-react";

interface DonorAnalyticsProps {
  donations: any[];
}

export const DonorAnalytics = ({ donations }: DonorAnalyticsProps) => {
  const totalDonors = new Set(donations.map(d => d.email)).size;
  const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  
  const oneTimeDonations = donations.filter(d => d.frequency === 'one-time');
  const monthlyDonations = donations.filter(d => d.frequency === 'monthly');
  
  const oneTimeTotal = oneTimeDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const monthlyTotal = monthlyDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  
  const avgDonation = donations.length > 0 ? totalAmount / donations.length : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDonors}</div>
          <p className="text-xs text-muted-foreground">
            Unique donors
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          <p className="text-xs text-muted-foreground">
            {donations.length} donations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">One-Time Donors</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{oneTimeDonations.length}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(oneTimeTotal)} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Donors</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{monthlyDonations.length}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(monthlyTotal)}/month
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-full md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(avgDonation)}</div>
          <p className="text-xs text-muted-foreground">
            Per donation
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-full md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">By Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(
              donations.reduce((acc: any, d) => {
                acc[d.campaign] = (acc[d.campaign] || 0) + parseFloat(d.amount);
                return acc;
              }, {})
            ).map(([campaign, amount]) => (
              <div key={campaign} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{campaign}</span>
                <span className="font-medium">{formatCurrency(amount as number)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
