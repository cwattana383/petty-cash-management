import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface DocumentType {
  id: string;
  documentName: string;
  isSupportDocument: boolean;
  ocrVerification: boolean;
  active: boolean;
}

let nextId = 5;

const initialData: DocumentType[] = [
  { id: "1", documentName: "Tax Invoice", isSupportDocument: false, ocrVerification: true, active: true },
  { id: "2", documentName: "Receipt", isSupportDocument: false, ocrVerification: true, active: true },
  { id: "3", documentName: "Boarding Pass", isSupportDocument: true, ocrVerification: false, active: true },
  { id: "4", documentName: "Hotel Folio", isSupportDocument: true, ocrVerification: false, active: true },
];

export default function DocumentTypePanel() {
  const [data, setData] = useState<DocumentType[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<DocumentType | null>(null);
  const [formName, setFormName] = useState("");
  const [formIsSupport, setFormIsSupport] = useState(false);
  const [formOcr, setFormOcr] = useState(false);
  const [formActive, setFormActive] = useState(true);

  const filtered = (() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.documentName.toLowerCase().includes(q));
    }
    if (statusFilter === "active") list = list.filter((d) => d.active);
    if (statusFilter === "inactive") list = list.filter((d) => !d.active);
    return list;
  })();

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditingRow(null);
    setFormName("");
    setFormIsSupport(false);
    setFormOcr(false);
    setFormActive(true);
    setModalOpen(true);
  };

  const openEdit = (row: DocumentType) => {
    setEditingRow(row);
    setFormName(row.documentName);
    setFormIsSupport(row.isSupportDocument);
    setFormOcr(row.ocrVerification);
    setFormActive(row.active);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error("Document Name is required.");
      return;
    }
    if (editingRow) {
      setData((prev) =>
        prev.map((d) =>
          d.id === editingRow.id
            ? { ...d, documentName: formName.trim(), isSupportDocument: formIsSupport, ocrVerification: formIsSupport ? false : formOcr, active: formActive }
            : d
        )
      );
      toast.success("Document type updated successfully.");
    } else {
      setData((prev) => [
        ...prev,
        {
          id: String(nextId++),
          documentName: formName.trim(),
          isSupportDocument: formIsSupport,
          ocrVerification: formIsSupport ? false : formOcr,
          active: formActive,
        },
      ]);
      toast.success("Document type added successfully.");
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((d) => d.id !== id));
    toast.success("Document type removed.");
  };

  const handleToggle = (id: string, checked: boolean) => {
    setData((prev) => prev.map((d) => (d.id === id ? { ...d, active: checked } : d)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Documents</h2>
          <p className="text-sm text-muted-foreground">Manage document types for expense claims.</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />Add Document Type
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search document type..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {(search || statusFilter !== "all") && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setStatusFilter("all"); setPage(1); }}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />Reset
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>OCR Verification</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No document types found
                  </TableCell>
                </TableRow>
              ) : (
                pageData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.documentName}</TableCell>
                    <TableCell>
                      <Badge variant={row.isSupportDocument ? "secondary" : "outline"}>
                        {row.isSupportDocument ? "Support" : "Primary"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={row.ocrVerification ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                        {row.ocrVerification ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={row.active} onCheckedChange={(checked) => handleToggle(row.id, checked)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />Previous
            </Button>
            <span className="text-muted-foreground">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit Document Type" : "Add Document Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Name <span className="text-destructive">*</span></Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Tax Invoice" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Is Support Document</Label>
              <Switch
                checked={formIsSupport}
                onCheckedChange={(v) => {
                  setFormIsSupport(v);
                  if (v) setFormOcr(false);
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>OCR Verification</Label>
                {formIsSupport && <p className="text-xs text-muted-foreground">Disabled for support documents</p>}
              </div>
              <Switch checked={formOcr} onCheckedChange={setFormOcr} disabled={formIsSupport} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
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
