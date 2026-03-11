import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  ArrowLeftRight,
  Settings,
  CheckSquare,
  ClipboardList,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useRoles } from "@/lib/role-context";
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
  { title: "Approval Inbox", url: "/approvals", icon: CheckSquare },
  { title: "Accounting Review", url: "/accounting", icon: ClipboardList },
  { title: "Bank Transactions", url: "/bank-transactions", icon: CreditCard },
  { title: "Admin", url: "/admin", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { roles, setRoles } = useRoles();

  const filteredNav = roles.length > 0
    ? mainNav.filter((item) => {
        // Cardholder only sees "My Expense"
        if (roles.length === 1 && roles.includes("Cardholder") && !roles.includes("Approver") && !roles.includes("Admin")) {
          return item.title === "My Expense";
        }
        // Approver sees My Expense + Approval Inbox
        if (roles.includes("Approver") && !roles.includes("Admin")) {
          return ["My Expense", "Approval Inbox"].includes(item.title);
        }
        // Admin sees all
        if (roles.includes("Admin")) {
          return true;
        }
        return item.title === "My Expense";
      })
    : mainNav;

  const demoRoles = [
    { key: "Cardholder", label: "👤 Cardholder" },
    { key: "Approver", label: "✅ Approver" },
    { key: "Admin", label: "⚙️ Admin" },
  ] as const;

  const activeDemo = roles.includes("Admin")
    ? "Admin"
    : roles.includes("Approver")
    ? "Approver"
    : "Cardholder";

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-lg text-primary">ExpenseClaim</span>
        </div>
        <div className="flex gap-1">
          {demoRoles.map((r) => (
            <button
              key={r.key}
              onClick={() => setRoles([r.key])}
              className={cn(
                "flex-1 text-xs py-1.5 rounded-md font-medium transition-colors",
                activeDemo === r.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
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
