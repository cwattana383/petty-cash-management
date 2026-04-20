import {
  FileText,
  Settings,
  CheckSquare,
  ClipboardList,
  CreditCard,
  Bell,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useRoles } from "@/lib/role-context";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "My Expense", url: "/claims", icon: FileText },
  { title: "Notifications", url: "/notifications", icon: Bell, cardholderOnly: true },
  { title: "Approval Inbox", url: "/approvals", icon: CheckSquare },
  { title: "Accounting Review", url: "/accounting", icon: ClipboardList },
  { title: "Bank Transactions", url: "/bank-transactions", icon: CreditCard },
  { title: "Admin", url: "/admin", icon: Settings },
];

const allRoleTabs = [
  { key: "Cardholder", label: "👤 Cardholder" },
  { key: "Approver", label: "✅ Approver" },
  { key: "Admin", label: "⚙️ Admin" },
] as const;

/** Return the nav items visible to a given selected role */
function getNavForRole(selectedRole: string) {
  switch (selectedRole) {
    case "Admin":
      return mainNav.filter((i) => !i.cardholderOnly);
    case "Approver":
      return mainNav.filter((i) => ["My Expense", "Approval Inbox"].includes(i.title));
    case "Cardholder":
    default:
      return mainNav.filter((i) => i.title === "My Expense" || i.title === "Notifications");
  }
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { roles, allRoles, setRoles } = useRoles();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  // Only show role tabs that the logged-in user actually has
  const userRoles = user?.roles ?? allRoles;
  const visibleRoleTabs = allRoleTabs.filter((r) =>
    userRoles.includes(r.key)
  );

  // The currently active/selected role (single role)
  const activeRole = roles.includes("Admin")
    ? "Admin"
    : roles.includes("Approver")
    ? "Approver"
    : "Cardholder";

  const filteredNav = getNavForRole(activeRole);

  const handleRoleSwitch = (roleKey: string) => {
    setRoles([roleKey]);
    queryClient.invalidateQueries({ queryKey: ["corp-card-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["corp-card-transactions-stats"] });
    // Redirect to /claims if current page isn't accessible for the new role
    const newNav = getNavForRole(roleKey);
    const currentPath = location.pathname;
    const isAccessible = newNav.some((item) => currentPath.startsWith(item.url));
    if (!isAccessible) {
      navigate("/claims");
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-lg text-primary">ExpenseClaim</span>
        </div>
        {visibleRoleTabs.length > 0 && (
          <div className="flex gap-1">
            {visibleRoleTabs.map((r) => (
              <button
                key={r.key}
                onClick={() => handleRoleSwitch(r.key)}
                className={cn(
                  "flex-1 text-xs py-1.5 rounded-md font-medium transition-all duration-200",
                  activeRole === r.key
                    ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:scale-105 hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
