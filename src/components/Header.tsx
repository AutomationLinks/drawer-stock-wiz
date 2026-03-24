import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/goodwish-logo-horizontal.png";
import { Menu, X, ChevronDown } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Donations",
    items: [
      { label: "Donate", to: "/donate" },
      { label: "Incoming Donations", to: "/incoming-donations" },
      { label: "Donor Information", to: "/donor-information" },
    ],
  },
  {
    label: "Volunteers",
    items: [
      { label: "Volunteer Signup", to: "/signup" },
      { label: "Volunteer Signups", to: "/volunteer-signups" },
      { label: "Admin Events", to: "/volunteer-events" },
      { label: "Events", to: "/events" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Companies", to: "/companies" },
      { label: "Sales Orders", to: "/sales-orders" },
      { label: "Invoices", to: "/invoices" },
      { label: "Analytics", to: "/analytics" },
    ],
  },
  {
    label: "Partners",
    items: [
      { label: "Partner Locations", to: "/partner-locations" },
      { label: "Training Videos", to: "/training-videos" },
    ],
  },
];

const DropdownLink = ({
  to,
  children,
  active,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        to={to}
        onClick={onClick}
        className={cn(
          "block select-none rounded-md px-3 py-2 text-sm leading-none no-underline outline-none transition-colors",
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          active && "bg-accent/50 text-accent-foreground font-medium"
        )}
      >
        {children}
      </Link>
    </NavigationMenuLink>
  </li>
);

export const Header = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (items: { to: string }[]) =>
    items.some((item) => location.pathname === item.to);

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="inline-block shrink-0">
          <img src={logo} alt="The Drawer Logo" className="h-14 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {/* Inventory - direct link */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  to="/inventory"
                  className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    isActive("/inventory") && "bg-accent/50 text-accent-foreground"
                  )}
                >
                  Inventory
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Grouped dropdowns */}
            {navGroups.map((group) => (
              <NavigationMenuItem key={group.label}>
                <NavigationMenuTrigger
                  className={cn(
                    isGroupActive(group.items) && "bg-accent/50 text-accent-foreground"
                  )}
                >
                  {group.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-48 gap-1 p-2">
                    {group.items.map((item) => (
                      <DropdownLink
                        key={item.to}
                        to={item.to}
                        active={isActive(item.to)}
                      >
                        {item.label}
                      </DropdownLink>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 overflow-y-auto">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <nav className="flex flex-col gap-1 mt-8">
              <Link
                to="/inventory"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                  isActive("/inventory") && "bg-accent/50"
                )}
              >
                Inventory
              </Link>

              {navGroups.map((group) => (
                <div key={group.label}>
                  <button
                    onClick={() =>
                      setOpenSection(openSection === group.label ? null : group.label)
                    }
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                      isGroupActive(group.items) && "bg-accent/50"
                    )}
                  >
                    {group.label}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openSection === group.label && "rotate-180"
                      )}
                    />
                  </button>
                  {openSection === group.label && (
                    <div className="ml-3 border-l border-border pl-3 flex flex-col gap-0.5 mt-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
                            isActive(item.to) && "bg-accent/50 font-medium"
                          )}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
