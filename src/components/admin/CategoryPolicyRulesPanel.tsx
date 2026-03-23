import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Ban, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CurrencyInput } from "@/components/ui/currency-input";

interface CategoryPolicyRule {
  id: string;
  expenseCategory: string;
  threshold: number;
  blocked: boolean;
  active: boolean;
  updatedAt: string;
}

const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

const categoryOptions = [
  "Hotel",
  "Transportation",
  "Entertainment",
  "Meals & Dining",
  "Office Supplies",
  "Fuel",
  "Utilities",
  "Training & Seminar",
  "Travel — Overseas",
  "Medical & Health",
  "Advertising & Promotion",
  "Repair & Maintenance",
  "Other",
];

const initialData: CategoryPolicyRule[] = [
  { id: "1", expenseCategory: "Hotel", threshold: 5000, blocked: false, active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "2", expenseCategory: "Transportation", threshold: 2000, blocked: false, active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "3", expenseCategory: "Entertainment", threshold: 1000, blocked: true, active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "4", expenseCategory: "Meals & Dining", threshold: 1500, blocked: false, active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "5", expenseCategory: "Office Supplies", threshold: 3000, blocked: false, active: false, updatedAt: "2026-03-20 14:30:00" },
  { id: "6", expenseCategory: "Fuel", threshold: 2500, blocked: false, active: true, updatedAt: "2026-03-22 09:15:00" },
];

let nextId = 7;

export default function CategoryPolicyRulesPanel() {
  const { toast } = useToast();
  const [data, setData] = useState<CategoryPolicyRule[]>(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<CategoryPolicyRule | null>(null);
  const [formCategory, setFormCategory] = useState("");
  const [formThreshold, setFormThreshold] = useState(0);
  const [formBlocked, setFormBlocked] = useState(false);
  const [formActive, setFormActive] = useState(true);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((r) => r.expenseCategory.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditingRow(null);
    setFormCategory("");
    setFormThreshold(0);
    setFormBlocked(false);
    setFormActive(true);
    setModalOpen(true);
  };

  const openEdit = (row: CategoryPolicyRule) => {
    setEditingRow(row);
    setFormCategory(row.expenseCategory);
    setFormThreshold(row.threshold);
    setFormBlocked(row.blocked);
    setFormActive(row.active);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formCategory) {
      toast({ title: "Validation Error", description: "Expense Category is required.", variant: "destructive" });
      return;
    }
    const ts = now();
    if (editingRow) {
      setData((prev) =>
        prev.map((r) =>
          r.id === editingRow.id
            ? { ...r, expenseCategory: formCategory, threshold: formThreshold, blocked: formBlocked, active: formActive, updatedAt: ts }
            : r
        )
      );
      toast({ title: "Updated", description: "Category policy rule updated." });
    } else {
      setData((prev) => [
        ...prev,
        { id: String(nextId++), expenseCategory: formCategory, threshold: formThreshold, blocked: formBlocked, active: formActive, updatedAt: ts },
      ]);
      toast({ title: "Created", description: "Category policy rule added." });
    }
    setModalOpen(false);
  };

  const handleDeactivate = (id: string) => {
    setData((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: false, updatedAt: now() } : r))
    );
    toast({ title: "Deactivated", description: "Rule has been deactivated." });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Category Policy Rules</h2>
          <p className="text-sm text-muted-foreground">
            Configure auto-approve thresholds and blocking rules per Expense Category.
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />Add Rule
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search expense category..."
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense Category</TableHead>
                <TableHead className="text-right">Auto-Approve Threshold (฿)</TableHead>
                <TableHead>Blocked</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No rules found
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.expenseCategory}</TableCell>
                  <TableCell className="text-right font-mono">
                    ฿{row.threshold.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.blocked ? "destructive" : "secondary"} className="text-xs">
                      {row.blocked ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${row.active ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-100"}`}
                    >
                      {row.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(row)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {row.active && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeactivate(row.id)} title="Deactivate">
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">{page} / {totalPages}</span>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit Rule" : "Add Rule"}</DialogTitle>
            <DialogDescription>
              {editingRow ? "Update the category policy rule." : "Create a new category policy rule."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Expense Category <span className="text-destructive">*</span></Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Auto-Approve Threshold (฿)</Label>
              <CurrencyInput value={formThreshold} onChange={setFormThreshold} placeholder="0.00" />
            </div>
            <div className="flex items-center gap-3">
              <Label>Blocked</Label>
              <Switch checked={formBlocked} onCheckedChange={setFormBlocked} />
              <span className="text-sm text-muted-foreground">{formBlocked ? "Yes — transactions will be blocked" : "No"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Label>Status</Label>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <span className="text-sm text-muted-foreground">{formActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
