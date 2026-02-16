import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Send, FileText, Plus, Trash2 } from "lucide-react";
import { currentUser } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { UploadedDoc, formatFileSize } from "@/lib/upload-types";
import { Input } from "@/components/ui/input";
import DocumentHeader from "@/components/claims/DocumentHeader";
import CreatorInformation from "@/components/claims/CreatorInformation";
import RequesterInformation, { type RequesterData } from "@/components/claims/RequesterInformation";
import AdvanceInformation, { type AdvanceData } from "@/components/claims/AdvanceInformation";

export default function CreateClaim() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Receive selected documents from /upload page
  const initialDocs: UploadedDoc[] = (location.state as any)?.selectedDocs || [];
  const isManualExpense: boolean = (location.state as any)?.isManualExpense || false;

  // Manual expense lines added by user
  const [manualLines, setManualLines] = useState<Array<{
    id: string;
    description: string;
    amount: number;
    vatCode: string;
    vatAmount: number;
    whtCode: string;
    whtAmount: number;
  }>>([]);

  const addManualLine = () => {
    setManualLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", amount: 0, vatCode: "", vatAmount: 0, whtCode: "", whtAmount: 0 },
    ]);
  };

  const updateManualLine = (id: string, field: string, value: any) => {
    setManualLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const removeManualLine = (id: string) => {
    setManualLines((prev) => prev.filter((l) => l.id !== id));
  };

  // Document header (read-only for new)
  const advanceNo = useMemo(() => {
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(6, "0");
    return `EXP-${new Date().getFullYear()}-${seq}`;
  }, []);
  const createDate = useMemo(() => new Date(), []);


  // Requester info
  const [requester, setRequester] = useState<RequesterData>({
    requestType: "Owner",
    employeeId: "",
    employee: currentUser.name,
    store: currentUser.branch,
    company: "ABC Co., Ltd.",
    telephone: currentUser.telephone || "",
    email: currentUser.email,
    division: currentUser.department,
  });

  // Advance info
  const [advance, setAdvance] = useState<AdvanceData>({
    purposeCategory: "",
    purposeSubCategory: "",
    payTo: "",
    expectationDate: undefined,
    numberOfGiftVoucher: 0,
    divisionGL: "-",
    description: "",
    cc: "",
    name: "-",
    amountIncVat: 0,
    withholdingTax: 0,
    paidAmount: 0,
    fee: 0,
  });

  const [advanceErrors, setAdvanceErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // Requester validation
    if (!requester.employee) {
      toast({ title: "Validation Error", description: "Requester Employee is required", variant: "destructive" });
      return false;
    }
    if (!requester.store) {
      toast({ title: "Validation Error", description: "Requester Store / Head Office is required", variant: "destructive" });
      return false;
    }

    // Advance validation
    if (!advance.purposeCategory) errors.purposeCategory = "Purpose Category is required";
    if (!advance.payTo) errors.payTo = "Pay To is required";
    
    if (!advance.purposeSubCategory) errors.purposeSubCategory = "Purpose Sub Category is required";
    if (!advance.amountIncVat || advance.amountIncVat <= 0) errors.amountIncVat = "Amount must be greater than 0";

    if (advance.withholdingTax > advance.amountIncVat) {
      errors.amountIncVat = "Withholding Tax cannot exceed Amount";
    }
    if (advance.fee > advance.amountIncVat) {
      errors.amountIncVat = "Fee cannot exceed Amount";
    }

    setAdvanceErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSave = (submit: boolean) => {
    if (submit && !validate()) return;
    toast({
      title: submit ? "Submitted" : "Saved",
      description: `Expense ${advanceNo} ${submit ? "submitted for approval" : "saved as draft"}`,
    });
    navigate("/claims");
  };

  const creatorData = {
    employee: currentUser.name,
    store: currentUser.branch,
    company: "ABC Co., Ltd.",
    email: currentUser.email,
    division: currentUser.department,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/claims")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isManualExpense ? "Create Manual Expense" : "Create Monthly Expense"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isManualExpense ? "กรอกข้อมูลรายการเบิกด้วยตนเอง (ไม่ผูกกับเอกสาร)" : "Fill in expense request details"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)}>
            <Save className="h-4 w-4 mr-1" />Save Draft
          </Button>
          <Button onClick={() => handleSave(true)}>
            <Send className="h-4 w-4 mr-1" />Submit
          </Button>
        </div>
      </div>

      {/* 1) Document Header */}
      <DocumentHeader
        advanceNo={advanceNo}
        glNo="-"
        status="Requester"
        createDate={createDate}
      />

      {/* 2) Creator Information */}
      <CreatorInformation
        employee={currentUser.name}
        store={currentUser.branch}
        company="ABC Co., Ltd."
        telephone={currentUser.telephone || "-"}
        email={currentUser.email}
        division={currentUser.department}
      />

      {/* 3) Requester Information */}
      <RequesterInformation
        data={requester}
        creatorData={creatorData}
        onChange={setRequester}
      />

      {/* 4) Advance Information */}
      <AdvanceInformation
        data={advance}
        onChange={setAdvance}
        errors={advanceErrors}
      />

      {/* 5) Expense List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Expense List ({initialDocs.length + manualLines.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addManualLine}>
              <Plus className="h-4 w-4 mr-1" />Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Description / Document</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>VAT Code</TableHead>
                  <TableHead>VAT Amount</TableHead>
                  <TableHead>WHT Code</TableHead>
                  <TableHead>WHT Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Document-based rows */}
                {initialDocs.map((doc, idx) => {
                  const amountField = doc.ocrData?.find((f) => f.label === "จำนวนเงิน");
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate max-w-[200px]">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{amountField ? amountField.value : "—"}</TableCell>
                      <TableCell className="text-sm">{doc.ocrData?.find((f) => f.label === "VAT Code")?.value || "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{doc.ocrData?.find((f) => f.label === "VAT Amount")?.value || "—"}</TableCell>
                      <TableCell className="text-sm">{doc.ocrData?.find((f) => f.label === "WHT Code")?.value || "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{doc.ocrData?.find((f) => f.label === "WHT Amount")?.value || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-green-300 bg-green-50 text-green-600">Verified</Badge>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  );
                })}
                {/* Manual rows */}
                {manualLines.map((line, idx) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-muted-foreground">{initialDocs.length + idx + 1}</TableCell>
                    <TableCell>
                      <Input
                        placeholder="รายละเอียด..."
                        value={line.description}
                        onChange={(e) => updateManualLine(line.id, "description", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min={0} step="0.01"
                        value={line.amount || ""}
                        onChange={(e) => updateManualLine(line.id, "amount", parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="—"
                        value={line.vatCode}
                        onChange={(e) => updateManualLine(line.id, "vatCode", e.target.value)}
                        className="h-8 text-sm w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min={0} step="0.01"
                        value={line.vatAmount || ""}
                        onChange={(e) => updateManualLine(line.id, "vatAmount", parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="—"
                        value={line.whtCode}
                        onChange={(e) => updateManualLine(line.id, "whtCode", e.target.value)}
                        className="h-8 text-sm w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min={0} step="0.01"
                        value={line.whtAmount || ""}
                        onChange={(e) => updateManualLine(line.id, "whtAmount", parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-600">Manual</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeManualLine(line.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {initialDocs.length === 0 && manualLines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      ยังไม่มีรายการ — กด "+ Add Item" เพื่อเพิ่มรายการ
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {(initialDocs.length > 0 || manualLines.length > 0) && (
            <div className="mt-3 flex justify-end">
              <div className="text-sm font-semibold">
                Total:{" "}
                {(
                  initialDocs.reduce((sum, d) => {
                    const amt = d.ocrData?.find((f) => f.label === "จำนวนเงิน")?.value;
                    return sum + (amt ? parseFloat(amt.replace(/,/g, "")) || 0 : 0);
                  }, 0) + manualLines.reduce((sum, l) => sum + l.amount, 0)
                ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
