import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, FolderOpen, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function ProjectCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const today = todayISO();

  const [projectName, setProjectName] = useState("");
  const [creationDate] = useState(today);
  const [creator] = useState(user?.name ?? "");
  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [effectiveTo, setEffectiveTo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const goBack = () => navigate("/admin?tab=project");

  const handleSave = () => {
    const next: Record<string, string> = {};
    if (!projectName.trim()) next.projectName = "Project Name is required";
    if (!creationDate) next.creationDate = "Creation Date is required";
    if (!creator.trim()) next.creator = "Creator is required";
    if (!accountCode.trim()) next.accountCode = "Account Code is required";
    if (!accountName.trim()) next.accountName = "Account Name is required";
    if (!effectiveFrom) next.effectiveFrom = "Effective Date From is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    toast({ title: "Project Created", description: `${projectName} was created successfully.` });
    goBack();
  };

  const errorClass = (k: string) => (errors[k] ? "border-destructive focus-visible:ring-destructive" : "");

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Project</h1>
          <p className="text-sm text-muted-foreground">Create a new project for expense allocation.</p>
        </div>
      </div>

      {/* Card 1 — Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name <span className="text-destructive">*</span></Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Digital Transformation 2026"
              className={cn(errorClass("projectName"))}
            />
            {errors.projectName && <p className="text-xs text-destructive">{errors.projectName}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creationDate">Creation Date <span className="text-destructive">*</span></Label>
              <Input id="creationDate" type="date" value={creationDate} readOnly className="bg-muted/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creator">Creator <span className="text-destructive">*</span></Label>
              <Input id="creator" value={creator} readOnly className="bg-muted/40" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2 — Account & Period */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Account & Period</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountCode">Account Code <span className="text-destructive">*</span></Label>
              <Input
                id="accountCode"
                value={accountCode}
                onChange={(e) => setAccountCode(e.target.value)}
                placeholder="e.g. 5100-001"
                className={cn(errorClass("accountCode"))}
              />
              {errors.accountCode && <p className="text-xs text-destructive">{errors.accountCode}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name <span className="text-destructive">*</span></Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Project Expenses"
                className={cn(errorClass("accountName"))}
              />
              {errors.accountName && <p className="text-xs text-destructive">{errors.accountName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective Date From <span className="text-destructive">*</span></Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className={cn(errorClass("effectiveFrom"))}
              />
              {errors.effectiveFrom && <p className="text-xs text-destructive">{errors.effectiveFrom}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveTo">Effective Date To</Label>
              <Input
                id="effectiveTo"
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-10">
        <div className="max-w-4xl mx-auto flex justify-end gap-3 px-6 py-3">
          <Button variant="outline" onClick={goBack}>Cancel</Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />Save
          </Button>
        </div>
      </div>
    </div>
  );
}
