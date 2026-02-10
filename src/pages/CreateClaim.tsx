import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, Send, ArrowLeft } from "lucide-react";
import { useClaims } from "@/lib/claims-context";
import { currentUser, branches, departments, costCenters, projects, expenseTypes, paymentMethods } from "@/lib/mock-data";
import { ClaimLine, ExpenseType, PaymentMethod } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const emptyLine = (): ClaimLine => ({
  id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  expenseType: "Other",
  description: "",
  amount: 0,
  vat: 0,
  taxInvoiceNo: "",
  invoiceDate: new Date().toISOString().slice(0, 10),
  vendor: "",
  paymentMethod: "Cash",
  projectId: "",
  memo: "",
});

export default function CreateClaim() {
  const navigate = useNavigate();
  const { addClaim, nextClaimNo } = useClaims();
  const { toast } = useToast();

  const [header, setHeader] = useState({
    company: "ABC Co., Ltd.",
    branch: currentUser.branch,
    department: currentUser.department,
    costCenter: currentUser.costCenter,
    purpose: "",
    currency: "THB",
    paymentMethod: "Cash" as PaymentMethod,
  });

  const [lines, setLines] = useState<ClaimLine[]>([emptyLine()]);

  const updateLine = (index: number, field: keyof ClaimLine, value: string | number) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = lines.reduce((s, l) => s + Number(l.amount), 0);
  const totalVat = lines.reduce((s, l) => s + Number(l.vat), 0);

  const validate = (): string[] => {
    const errors: string[] = [];
    if (!header.purpose.trim()) errors.push("Purpose is required");
    if (lines.length === 0) errors.push("At least one expense line is required");
    lines.forEach((l, i) => {
      if (l.amount <= 0) errors.push(`Line ${i + 1}: Amount must be greater than 0`);
      if (!l.description.trim()) errors.push(`Line ${i + 1}: Description is required`);
      if (l.vat > 0 && !l.taxInvoiceNo.trim()) errors.push(`Line ${i + 1}: Tax Invoice No. is required when VAT > 0`);
    });
    return errors;
  };

  const saveClaim = (submit: boolean) => {
    const errors = submit ? validate() : [];
    if (errors.length > 0) {
      toast({ title: "Validation Error", description: errors.join("\n"), variant: "destructive" });
      return;
    }

    const claimNo = nextClaimNo();
    addClaim({
      id: `c-${Date.now()}`,
      claimNo,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      company: header.company,
      branch: header.branch,
      department: header.department,
      costCenter: header.costCenter,
      purpose: header.purpose,
      currency: header.currency,
      paymentMethod: header.paymentMethod,
      totalAmount,
      totalVat,
      status: submit ? "Pending Approval" : "Draft",
      createdDate: new Date().toISOString().slice(0, 10),
      submittedDate: submit ? new Date().toISOString().slice(0, 10) : null,
      lines,
      approvalHistory: submit
        ? [{ stepNo: 1, approverId: "u2", approverName: currentUser.managerName || "Manager", action: "Pending", comment: "", actionDate: null }]
        : [],
      comments: [],
    });

    toast({ title: submit ? "Submitted" : "Saved", description: `Claim ${claimNo} ${submit ? "submitted for approval" : "saved as draft"}` });
    navigate("/claims");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/claims")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Expense Claim</h1>
          <p className="text-muted-foreground">Fill in claim details or upload documents</p>
        </div>
      </div>

      {/* Header */}
      <Card>
        <CardHeader><CardTitle className="text-base">Claim Header</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><Label>Company</Label><Input value={header.company} disabled /></div>
          <div>
            <Label>Branch</Label>
            <Select value={header.branch} onValueChange={(v) => setHeader((h) => ({ ...h, branch: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Department</Label>
            <Select value={header.department} onValueChange={(v) => setHeader((h) => ({ ...h, department: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cost Center</Label>
            <Select value={header.costCenter} onValueChange={(v) => setHeader((h) => ({ ...h, costCenter: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{costCenters.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Payment Method</Label>
            <Select value={header.paymentMethod} onValueChange={(v) => setHeader((h) => ({ ...h, paymentMethod: v as PaymentMethod }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{paymentMethods.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={header.currency} onValueChange={(v) => setHeader((h) => ({ ...h, currency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="THB">THB - Thai Baht</SelectItem>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Label>Purpose / Description</Label>
            <Textarea placeholder="Describe the purpose of this expense claim..." value={header.purpose} onChange={(e) => setHeader((h) => ({ ...h, purpose: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Expense Lines</CardTitle>
          <Button size="sm" onClick={addLine}><Plus className="h-4 w-4 mr-1" />Add Line</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, i) => (
                <TableRow key={line.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <Select value={line.expenseType} onValueChange={(v) => updateLine(i, "expenseType", v)}>
                      <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{expenseTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input className="min-w-[150px]" placeholder="Description" value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)} /></TableCell>
                  <TableCell><Input className="min-w-[120px]" placeholder="Vendor" value={line.vendor} onChange={(e) => updateLine(i, "vendor", e.target.value)} /></TableCell>
                  <TableCell><Input className="min-w-[120px]" placeholder="INV-XXX" value={line.taxInvoiceNo} onChange={(e) => updateLine(i, "taxInvoiceNo", e.target.value)} /></TableCell>
                  <TableCell><Input type="date" className="min-w-[130px]" value={line.invoiceDate} onChange={(e) => updateLine(i, "invoiceDate", e.target.value)} /></TableCell>
                  <TableCell><Input type="number" className="w-[100px] text-right" value={line.amount || ""} onChange={(e) => updateLine(i, "amount", parseFloat(e.target.value) || 0)} /></TableCell>
                  <TableCell><Input type="number" className="w-[80px] text-right" value={line.vat || ""} onChange={(e) => updateLine(i, "vat", parseFloat(e.target.value) || 0)} /></TableCell>
                  <TableCell>
                    <Select value={line.projectId || "none"} onValueChange={(v) => updateLine(i, "projectId", v === "none" ? "" : v)}>
                      <SelectTrigger className="w-[110px]"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeLine(i)} disabled={lines.length <= 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary & Actions */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex gap-6">
              <div><span className="text-sm text-muted-foreground">Subtotal:</span> <span className="font-semibold">฿{(totalAmount - totalVat).toLocaleString()}</span></div>
              <div><span className="text-sm text-muted-foreground">VAT:</span> <span className="font-semibold">฿{totalVat.toLocaleString()}</span></div>
              <div><span className="text-sm text-muted-foreground">Total:</span> <span className="font-bold text-lg text-primary">฿{totalAmount.toLocaleString()}</span></div>
            </div>
            <p className="text-xs text-muted-foreground">{lines.length} line(s)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => saveClaim(false)}><Save className="h-4 w-4 mr-1" />Save Draft</Button>
            <Button onClick={() => saveClaim(true)}><Send className="h-4 w-4 mr-1" />Submit for Approval</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
