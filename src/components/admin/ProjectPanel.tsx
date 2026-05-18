import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, Pencil, Trash2, RotateCcw } from "lucide-react";

interface ProjectRow {
  id: string;
  code: string;
  name: string;
  owner: string;
  active: boolean;
  updatedAt: string;
}

const mockProjects: ProjectRow[] = [
  { id: "p1", code: "PRJ-001", name: "Digital Transformation 2026", owner: "Somsak Wichan", active: true, updatedAt: "22/04/2569 07:00:00" },
  { id: "p2", code: "PRJ-002", name: "Branch Expansion - North", owner: "Wipa Sukjai", active: true, updatedAt: "22/04/2569 07:00:00" },
  { id: "p3", code: "PRJ-003", name: "ERP Upgrade Phase 2", owner: "Pim Dee", active: true, updatedAt: "22/04/2569 07:00:00" },
  { id: "p4", code: "PRJ-004", name: "Customer Loyalty Program", owner: "Somying Kaewsai", active: false, updatedAt: "22/04/2569 07:00:00" },
];

export default function ProjectPanel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockProjects.filter((p) => {
    const matchSearch = !search ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.owner.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? p.active : !p.active);
    return matchSearch && matchStatus;
  });

  const hasActiveFilters = search !== "" || statusFilter !== "all";
  const resetFilters = () => { setSearch(""); setStatusFilter("all"); };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Project</h2>
          <p className="text-sm text-muted-foreground">Manage projects available for expense allocation.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Project
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={resetFilters} className="text-muted-foreground">
            <RotateCcw className="mr-1 h-3.5 w-3.5" />Reset
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No projects found</TableCell></TableRow>
              )}
              {filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.owner}</TableCell>
                  <TableCell className="text-sm">{p.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="View">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
