import { InventoryDashboard } from "@/components/InventoryDashboard";
import { AnalyticsSummary } from "@/components/AnalyticsSummary";

const Inventory = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">The Drawer</h1>
              <p className="text-primary-foreground/80 mt-1">Inventory Management System</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <AnalyticsSummary />
        <InventoryDashboard />
      </div>
    </div>
  );
};

export default Inventory;
