import { useState, useMemo } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { formatBEDate } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Send, FileText, Plus, Trash2, CalendarIcon, Paperclip } from "lucide-react";
import { currentUser } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { UploadedDoc, formatFileSize } from "@/lib/upload-types";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DocumentHeader from "@/components/claims/DocumentHeader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import CreatorInformation from "@/components/claims/CreatorInformation";
import RequesterInformation, { type RequesterData } from "@/components/claims/RequesterInformation";
import AdvanceInformation, { type AdvanceData } from "@/components/claims/AdvanceInformation";

export default function CreateClaim() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Receive selected documents from /upload page
  const rawDocs: UploadedDoc[] = (location.state as any)?.selectedDocs || [];
  const isManualExpense: boolean = (location.state as any)?.isManualExpense || false;

  // Convert OCR docs into editable lines
  const [docLines, setDocLines] = useState<Array<{
    id: string;
    docName: string;
    invoiceDate?: Date;
    invoiceNumber: string;
    paymentMethod: string;
    supplierName: string;
    accountCode: string;
    description: string;
    expenseType: string;
    amount: number;
    vatCode: string;
    vatAmount: number;
    totalAmount: number;
    whtCode: string;
    whtAmount: number;
  }>>(() =>
    rawDocs.map((doc) => ({
      id: doc.id,
      docName: doc.name,
      invoiceDate: undefined,
      invoiceNumber: "",
      paymentMethod: "Credit Card",
      supplierName: "",
      accountCode: "",
      description: doc.name,
      expenseType: "",
      amount: parseFloat(doc.ocrData?.find((f) => f.label === "Amount")?.value?.replace(/,/g, "") || "0") || 0,
      vatCode: doc.ocrData?.find((f) => f.label === "VAT Code")?.value || "",
      vatAmount: parseFloat(doc.ocrData?.find((f) => f.label === "VAT Amount")?.value?.replace(/,/g, "") || "0") || 0,
      totalAmount: 0,
      whtCode: doc.ocrData?.find((f) => f.label === "WHT Code")?.value || "",
      whtAmount: parseFloat(doc.ocrData?.find((f) => f.label === "WHT Amount")?.value?.replace(/,/g, "") || "0") || 0,
    }))
  );

  const updateDocLine = (id: string, field: string, value: any) => {
    setDocLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  // Manual expense lines added by user
  const expenseTypes = ["Traveling Expenses", "Gasoline", "Toll Fee", "Entertainment", "Staff Meeting", "Parking Fee"];
  const accountCodes = [
    { code: "2186101", name: "Other Personnel Cost-Other" },
    { code: "21862011", name: "Entertainment" },
    { code: "21862012", name: "Staff Meeting and Refreshment" },
    { code: "21862021", name: "Local Traveling" },
    { code: "21863011", name: "Vehicle Running Cost-Fuel" },
    { code: "21863091", name: "Vehicle Running Cost-Other" },
  ];

  const [manualLines, setManualLines] = useState<Array<{
    id: string;
    invoiceDate?: Date;
    description: string;
    expenseType: string;
    paymentMethod: string;
    amount: number;
    vatCode: string;
    vatAmount: number;
    totalAmount: number;
    whtCode: string;
    whtAmount: number;
    attachedFile?: File;
  }>>([]);

  const addManualLine = () => {
    setManualLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", expenseType: "", paymentMethod: "Credit Card", amount: 0, vatCode: "", vatAmount: 0, totalAmount: 0, whtCode: "", whtAmount: 0 },
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
    employee: "Somchai Jaidee",
    store: currentUser.branch,
    company: "CP Axtra Public Company Limited",
    telephone: "0657778899",
    email: "somchai@cpaxtra.co.th",
    division: "92029 – Accounting",
    department: "9993010460 Finance and Accounting",
    branch: "099999 – HO",
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

    setAdvanceErrors(errors);
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
    division: "92029 : Finance & Accounting",
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
              {isManualExpense ? "Create Manual Expense" : "Create Expense"}
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
        status="Pending Invoice"
        createDate={createDate}
      />

      {/* 2) Creator Information - hidden */}

      {/* 3) Requester Information */}
      <RequesterInformation
        data={requester}
        creatorData={creatorData}
        onChange={setRequester}
      />

      {/* 4) Advance Information - hidden */}

      {/* 5) Expense List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Expense List ({docLines.length + manualLines.length})
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
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Attached File</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Expense Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>VAT Code</TableHead>
                  <TableHead>VAT Amount</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>WHT Code</TableHead>
                  <TableHead>WHT Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Document-based rows (editable) */}
                {docLines.map((line, idx) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("h-8 text-sm w-32 justify-start text-left font-normal", !line.invoiceDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                            {line.invoiceDate ? formatBEDate(line.invoiceDate) : "วันที่..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={line.invoiceDate} onSelect={(d) => updateDocLine(line.id, "invoiceDate", d)} disabled={(date) => date < subMonths(new Date(), 1) || date > addMonths(new Date(), 1)} initialFocus className={cn("p-3 pointer-events-auto")} />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Input placeholder="Invoice No...." value={line.invoiceNumber} onChange={(e) => updateDocLine(line.id, "invoiceNumber", e.target.value)} className="h-8 text-sm w-24" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm text-blue-600 underline truncate max-w-[120px]">{line.docName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={line.paymentMethod} onValueChange={(v) => updateDocLine(line.id, "paymentMethod", v)}>
                        <SelectTrigger className="h-8 text-sm w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input placeholder="ชื่อผู้ขาย..." value={line.supplierName} onChange={(e) => updateDocLine(line.id, "supplierName", e.target.value)} className="h-8 text-sm w-28" />
                    </TableCell>
                    <TableCell>
                      <Select value={line.accountCode} onValueChange={(v) => updateDocLine(line.id, "accountCode", v)}>
                        <SelectTrigger className="h-8 text-sm w-44"><SelectValue placeholder="เลือกรหัสบัญชี" /></SelectTrigger>
                        <SelectContent>
                          {accountCodes.map((ac) => (<SelectItem key={ac.code} value={ac.code}>{ac.code} - {ac.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input placeholder="รายละเอียด..." value={line.description} onChange={(e) => updateDocLine(line.id, "description", e.target.value)} className="h-8 text-sm" />
                    </TableCell>
                    <TableCell>
                      <Select value={line.expenseType} onValueChange={(v) => updateDocLine(line.id, "expenseType", v)}>
                        <SelectTrigger className="h-8 text-sm w-40"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {expenseTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <CurrencyInput value={line.amount} onChange={(v) => updateDocLine(line.id, "amount", v)} className="h-8 text-sm w-28" />
                    </TableCell>
                    <TableCell>
                      <Select value={line.vatCode} onValueChange={(v) => updateDocLine(line.id, "vatCode", v)}>
                        <SelectTrigger className="h-8 text-sm w-32"><SelectValue placeholder="เลือก VAT" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AVG">AVG</SelectItem>
                          <SelectItem value="Claim 100%">Claim 100%</SelectItem>
                          <SelectItem value="No.vat">No.vat</SelectItem>
                          <SelectItem value="Unclaim 10%">Unclaim 10%</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <CurrencyInput value={line.vatAmount} onChange={(v) => updateDocLine(line.id, "vatAmount", v)} className="h-8 text-sm w-28" />
                    </TableCell>
                    <TableCell>
                      <CurrencyInput value={line.totalAmount} onChange={(v) => updateDocLine(line.id, "totalAmount", v)} className="h-8 text-sm w-28" />
                    </TableCell>
                    <TableCell>
                      <Select value={line.whtCode} onValueChange={(v) => updateDocLine(line.id, "whtCode", v)}>
                        <SelectTrigger className="h-8 text-sm w-36"><SelectValue placeholder="เลือก WHT" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Advertising 3">Advertising 3</SelectItem>
                          <SelectItem value="Advertising 53">Advertising 53</SelectItem>
                          <SelectItem value="Delivery 3">Delivery 3</SelectItem>
                          <SelectItem value="Delivery 53">Delivery 53</SelectItem>
                          <SelectItem value="Rental/Prize 3">Rental/Prize 3</SelectItem>
                          <SelectItem value="Rental/Prize 53">Rental/Prize 53</SelectItem>
                          <SelectItem value="Service (1.5) 3">Service (1.5) 3</SelectItem>
                          <SelectItem value="Service (1.5) 53">Service (1.5) 53</SelectItem>
                          <SelectItem value="Service 3">Service 3</SelectItem>
                          <SelectItem value="Service 53">Service 53</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <CurrencyInput value={line.whtAmount} onChange={(v) => updateDocLine(line.id, "whtAmount", v)} className="h-8 text-sm w-28" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-green-300 bg-green-50 text-green-600">Verified</Badge>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
                {/* Manual rows */}
                {manualLines.map((line, idx) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-muted-foreground">{docLines.length + idx + 1}</TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("h-8 text-sm w-32 justify-start text-left font-normal", !line.invoiceDate && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                            {line.invoiceDate ? formatBEDate(line.invoiceDate) : "วันที่..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={line.invoiceDate}
                            onSelect={(d) => updateManualLine(line.id, "invoiceDate", d)}
                            disabled={(date) => date < subMonths(new Date(), 1) || date > addMonths(new Date(), 1)}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Input placeholder="Invoice No...." className="h-8 text-sm w-24" />
                    </TableCell>
                    <TableCell>
                      {line.attachedFile ? (
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-xs text-primary truncate max-w-[100px]" title={line.attachedFile.name}>{line.attachedFile.name}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateManualLine(line.id, "attachedFile", undefined)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) updateManualLine(line.id, "attachedFile", file);
                            }}
                          />
                          <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <Paperclip className="h-3.5 w-3.5" /> แนบfiles
                          </span>
                        </label>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select value={line.paymentMethod} onValueChange={(v) => updateManualLine(line.id, "paymentMethod", v)}>
                        <SelectTrigger className="h-8 text-sm w-32">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input placeholder="ชื่อผู้ขาย..." className="h-8 text-sm w-28" />
                    </TableCell>
                    <TableCell>
                      <Select onValueChange={(v) => updateManualLine(line.id, "accountCode", v)}>
                        <SelectTrigger className="h-8 text-sm w-44">
                          <SelectValue placeholder="เลือกรหัสบัญชี" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountCodes.map((ac) => (
                            <SelectItem key={ac.code} value={ac.code}>{ac.code} - {ac.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="รายละเอียด..."
                        value={line.description}
                        onChange={(e) => updateManualLine(line.id, "description", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={line.expenseType} onValueChange={(v) => updateManualLine(line.id, "expenseType", v)}>
                        <SelectTrigger className="h-8 text-sm w-40">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseTypes.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <CurrencyInput
                        value={line.amount}
                        onChange={(v) => updateManualLine(line.id, "amount", v)}
                        className="h-8 text-sm w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={line.vatCode} onValueChange={(v) => updateManualLine(line.id, "vatCode", v)}>
                        <SelectTrigger className="h-8 text-sm w-32">
                          <SelectValue placeholder="เลือก VAT" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AVG">AVG</SelectItem>
                          <SelectItem value="Claim 100%">Claim 100%</SelectItem>
                          <SelectItem value="No.vat">No.vat</SelectItem>
                          <SelectItem value="Unclaim 10%">Unclaim 10%</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <CurrencyInput
                        value={line.vatAmount}
                        onChange={(v) => updateManualLine(line.id, "vatAmount", v)}
                        className="h-8 text-sm w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <CurrencyInput
                        value={line.totalAmount}
                        onChange={(v) => updateManualLine(line.id, "totalAmount", v)}
                        className="h-8 text-sm w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={line.whtCode} onValueChange={(v) => updateManualLine(line.id, "whtCode", v)}>
                        <SelectTrigger className="h-8 text-sm w-36">
                          <SelectValue placeholder="เลือก WHT" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Advertising 3">Advertising 3</SelectItem>
                          <SelectItem value="Advertising 53">Advertising 53</SelectItem>
                          <SelectItem value="Delivery 3">Delivery 3</SelectItem>
                          <SelectItem value="Delivery 53">Delivery 53</SelectItem>
                          <SelectItem value="Rental/Prize 3">Rental/Prize 3</SelectItem>
                          <SelectItem value="Rental/Prize 53">Rental/Prize 53</SelectItem>
                          <SelectItem value="Service (1.5) 3">Service (1.5) 3</SelectItem>
                          <SelectItem value="Service (1.5) 53">Service (1.5) 53</SelectItem>
                          <SelectItem value="Service 3">Service 3</SelectItem>
                          <SelectItem value="Service 53">Service 53</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <CurrencyInput
                        value={line.whtAmount}
                        onChange={(v) => updateManualLine(line.id, "whtAmount", v)}
                        className="h-8 text-sm w-28"
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
                {docLines.length === 0 && manualLines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={17} className="text-center text-muted-foreground py-8">
                      ยังไม่มีรายการ — กด "+ Add Item" เพื่อเพิ่มรายการ
                    </TableCell>
                  </TableRow>
                )}
                {/* Totals row */}
                {(docLines.length > 0 || manualLines.length > 0) && (
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right text-sm">Total</TableCell>
                    <TableCell className="text-right text-sm">
                      {(docLines.reduce((sum, l) => sum + l.amount, 0) + manualLines.reduce((sum, l) => sum + l.amount, 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right text-sm">
                      {(docLines.reduce((sum, l) => sum + l.vatAmount, 0) + manualLines.reduce((sum, l) => sum + l.vatAmount, 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {(docLines.reduce((sum, l) => sum + l.totalAmount, 0) + manualLines.reduce((sum, l) => sum + l.totalAmount, 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right text-sm">
                      {(docLines.reduce((sum, l) => sum + l.whtAmount, 0) + manualLines.reduce((sum, l) => sum + l.whtAmount, 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
