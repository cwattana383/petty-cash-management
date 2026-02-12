import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Send } from "lucide-react";
import { currentUser } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import DocumentHeader from "@/components/claims/DocumentHeader";
import CreatorInformation from "@/components/claims/CreatorInformation";
import RequesterInformation, { type RequesterData } from "@/components/claims/RequesterInformation";
import AdvanceInformation, { type AdvanceData } from "@/components/claims/AdvanceInformation";

export default function CreateClaim() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Document header (read-only for new)
  const advanceNo = useMemo(() => {
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(6, "0");
    return `ADV-${new Date().getFullYear()}-${seq}`;
  }, []);
  const createDate = useMemo(() => new Date(), []);

  // Creator info
  const [creatorTel, setCreatorTel] = useState("");

  // Requester info
  const [requester, setRequester] = useState<RequesterData>({
    requestType: "Owner",
    employeeId: "",
    employee: currentUser.name,
    store: currentUser.branch,
    company: "ABC Co., Ltd.",
    telephone: "",
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
        telephone={creatorTel}
        email={currentUser.email}
        division={currentUser.department}
        onTelephoneChange={setCreatorTel}
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
    </div>
  );
}
