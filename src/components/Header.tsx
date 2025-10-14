import { Link } from "react-router-dom";
import logo from "@/assets/goodwish-logo-horizontal.png";

export const Header = () => {
  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 py-4">
        <Link to="/" className="inline-block">
          <img 
            src={logo} 
            alt="The Drawer Logo" 
            className="h-16 w-auto"
          />
        </Link>
      </div>
    </header>
  );
};
