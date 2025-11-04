import { Link } from "react-router-dom";
import logo from "@/assets/goodwish-logo-horizontal.png";

export const Header = () => {
  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="inline-block">
          <img 
            src={logo} 
            alt="The Drawer Logo" 
            className="h-16 w-auto"
          />
        </Link>
        <nav className="flex gap-6">
          <Link to="/inventory" className="text-foreground hover:text-primary transition-colors">Inventory</Link>
          <Link to="/donate" className="text-foreground hover:text-primary transition-colors">Donate</Link>
          <Link to="/signup" className="text-foreground hover:text-primary transition-colors">Volunteer</Link>
          <Link to="/analytics" className="text-foreground hover:text-primary transition-colors">Analytics</Link>
          <Link to="/companies" className="text-foreground hover:text-primary transition-colors">Companies</Link>
          <Link to="/sales-orders" className="text-foreground hover:text-primary transition-colors">Sales Orders</Link>
          <Link to="/invoices" className="text-foreground hover:text-primary transition-colors">Invoices</Link>
        </nav>
      </div>
    </header>
  );
};
