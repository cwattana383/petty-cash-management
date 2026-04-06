import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Lock, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { NotificationCenter } from "@/components/NotificationCenter";

export function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { open: sidebarOpen, toggleSidebar } = useSidebar();

  const displayName = user?.name || "User";
  const initials = displayName[0] || "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="h-8">
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4 mr-1.5" /> : <PanelLeftOpen className="h-4 w-4 mr-1.5" />}
              <span className="text-xs hidden sm:inline">{sidebarOpen ? "Hide Nav" : "Show Nav"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {sidebarOpen ? "Collapse navigation sidebar" : "Expand navigation sidebar"}
          </TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold hidden md:inline topbar-title">
            Corporate Card Expense Management
          </h1>
          <style>{`
            .topbar-title {
              color: #dc2626;
              opacity: 0;
              transform: translateY(-8px);
              animation: title-enter 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
            }

            @keyframes title-enter {
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationCenter />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline">{displayName}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
