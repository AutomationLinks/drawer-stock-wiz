import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Inventory from "./pages/Inventory";
import Donate from "./pages/Donate";
import Signup from "./pages/Signup";
import Counter from "./pages/Counter";
import Analytics from "./pages/Analytics";
import Companies from "./pages/Companies";
import SalesOrders from "./pages/SalesOrders";
import Invoices from "./pages/Invoices";
import EmbedDonate from "./pages/EmbedDonate";
import EmbedInventory from "./pages/EmbedInventory";
import EmbedSignup from "./pages/EmbedSignup";
import EmbedCounter from "./pages/EmbedCounter";
import DonorInformation from "./pages/DonorInformation";
import NotFound from "./pages/NotFound";
import { usePageTracking } from "./hooks/usePageTracking";

const queryClient = new QueryClient();

const AppContent = () => {
  usePageTracking();
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/inventory" replace />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/donate" element={<Donate />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/counter" element={<Counter />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/companies" element={<Companies />} />
      <Route path="/sales-orders" element={<SalesOrders />} />
      <Route path="/invoices" element={<Invoices />} />
      <Route path="/embed/donate" element={<EmbedDonate />} />
      <Route path="/embed/inventory" element={<EmbedInventory />} />
      <Route path="/embed/signup" element={<EmbedSignup />} />
      <Route path="/embed/counter" element={<EmbedCounter />} />
      <Route path="/donor-information" element={<DonorInformation />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
