import { InventoryDashboard } from "@/components/InventoryDashboard";
import { AnalyticsSummary } from "@/components/AnalyticsSummary";
import { DonationCounter } from "@/components/DonationCounter";

const EmbedInventory = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <DonationCounter />
        <AnalyticsSummary />
        <InventoryDashboard />
      </div>
    </div>
  );
};

export default EmbedInventory;
