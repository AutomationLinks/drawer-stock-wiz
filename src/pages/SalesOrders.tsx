import { Header } from "@/components/Header";
import { SalesReportingDashboard } from "@/components/SalesReportingDashboard";
import { SalesOrdersTable } from "@/components/SalesOrdersTable";

const SalesOrders = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Sales Order Management</h1>
        <SalesReportingDashboard />
        <SalesOrdersTable />
      </div>
    </div>
  );
};

export default SalesOrders;
