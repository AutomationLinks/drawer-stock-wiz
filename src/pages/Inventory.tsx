import { InventoryDashboard } from "@/components/InventoryDashboard";
import { AnalyticsSummary } from "@/components/AnalyticsSummary";
import { Header } from "@/components/Header";

const Inventory = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <AnalyticsSummary />
        <InventoryDashboard />
      </div>
    </div>
  );
};

export default Inventory;
