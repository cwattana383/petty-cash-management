import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Send, FileText } from "lucide-react";
import { currentUser } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { UploadedDoc, formatFileSize } from "@/lib/upload-types";
import DocumentHeader from "@/components/claims/DocumentHeader";
import CreatorInformation from "@/components/claims/CreatorInformation";
import RequesterInformation, { type RequesterData } from "@/components/claims/RequesterInformation";
import AdvanceInformation, { type AdvanceData } from "@/components/claims/AdvanceInformation";

export default function CreateClaim() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Receive selected documents from /upload page
  const selectedDocs: UploadedDoc[] = (location.state as any)?.selectedDocs || [];

  // Document header (read-only for new)
  const advanceNo = useMemo(() => {
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(6, "0");
    return `ADV-${new Date().getFullYear()}-${seq}`;
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
    if (!advance.expectationDate) errors.expectationDate = "Expectation Date is required";
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
      description: `Advance ${advanceNo} ${submit ? "submitted for approval" : "saved as draft"}`,
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
            <h1 className="text-2xl font-bold text-foreground">Create Advance Request</h1>
            <p className="text-muted-foreground text-sm">Fill in advance request details</p>
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

      {/* 5) Attached Document Transactions */}
      {selectedDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Transactions from Documents ({selectedDocs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>OCR Fields</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>VAT Code</TableHead>
                    <TableHead>VAT Amount</TableHead>
                    <TableHead>WHT Code</TableHead>
                    <TableHead>WHT Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDocs.map((doc, idx) => {
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
                        <TableCell className="text-sm text-muted-foreground">{formatFileSize(doc.size)}</TableCell>
                        <TableCell>
                          {doc.ocrData ? (
                            <span className="text-sm">{doc.ocrData.length} fields extracted</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {amountField ? amountField.value : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {doc.ocrData?.find((f) => f.label === "VAT Code")?.value || "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {doc.ocrData?.find((f) => f.label === "VAT Amount")?.value || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {doc.ocrData?.find((f) => f.label === "WHT Code")?.value || "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {doc.ocrData?.find((f) => f.label === "WHT Amount")?.value || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-600">
                            Verified
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {selectedDocs.some((d) => d.ocrData?.find((f) => f.label === "จำนวนเงิน")) && (
              <div className="mt-3 flex justify-end">
                <div className="text-sm font-semibold">
                  Total:{" "}
                  {selectedDocs
                    .reduce((sum, d) => {
                      const amt = d.ocrData?.find((f) => f.label === "จำนวนเงิน")?.value;
                      return sum + (amt ? parseFloat(amt.replace(/,/g, "")) || 0 : 0);
                    }, 0)
                    .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
