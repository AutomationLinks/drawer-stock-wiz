import { InventoryDashboard } from "@/components/InventoryDashboard";
import { AnalyticsSummary } from "@/components/AnalyticsSummary";

const EmbedInventory = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <AnalyticsSummary />
        <InventoryDashboard />
      </div>
    </div>
  );
};

export default EmbedInventory;
