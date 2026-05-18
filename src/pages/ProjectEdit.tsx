import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, FolderOpen, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getProjectById } from "@/lib/project-mock-data";

export default function ProjectEdit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const existing = id ? getProjectById(id) : undefined;

  const goBack = () => navigate("/admin?tab=project");

  const [projectName, setProjectName] = useState(existing?.name ?? "");
  const [creationDate] = useState(existing?.creationDate ?? "");
  const [creator] = useState(existing?.owner ?? "");
  const [accountCode, setAccountCode] = useState(existing?.accountCode ?? "");
  const [accountName, setAccountName] = useState(existing?.accountName ?? "");
  const [effectiveFrom, setEffectiveFrom] = useState(existing?.effectiveFrom ?? "");
  const [effectiveTo, setEffectiveTo] = useState(existing?.effectiveTo ?? "");
  const [active, setActive] = useState(existing?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!existing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        <p className="mt-6 text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  const handleSave = () => {
    const next: Record<string, string> = {};
    if (!projectName.trim()) next.projectName = "Project Name is required";
    if (!accountCode.trim()) next.accountCode = "Account Code is required";
    if (!accountName.trim()) next.accountName = "Account Name is required";
    if (!effectiveFrom) next.effectiveFrom = "Effective Date From is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    toast({ title: "Project Updated", description: `${projectName} was updated successfully.` });
    goBack();
  };

  const errorClass = (k: string) => (errors[k] ? "border-destructive focus-visible:ring-destructive" : "");

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Project</h1>
          <p className="text-sm text-muted-foreground">Update the project details.</p>
        </div>
      </div>

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
              className={cn(errorClass("projectName"))}
            />
            {errors.projectName && <p className="text-xs text-destructive">{errors.projectName}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creationDate">Creation Date</Label>
              <Input id="creationDate" type="date" value={creationDate} readOnly className="bg-muted/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creator">Creator</Label>
              <Input id="creator" value={creator} readOnly className="bg-muted/40" />
            </div>
          </div>
        </CardContent>
      </Card>

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

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <Label htmlFor="active" className="text-sm">Status</Label>
              <p className="text-xs text-muted-foreground">Toggle to activate or deactivate this project.</p>
            </div>
            <div className="flex items-center gap-3">
              {active ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Active</Badge>
              ) : (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">Inactive</Badge>
              )}
              <Switch id="active" checked={active} onCheckedChange={setActive} />
            </div>
          </div>
        </CardContent>
      </Card>

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
