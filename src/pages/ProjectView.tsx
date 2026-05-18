import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Pencil, FolderOpen, Wallet } from "lucide-react";
import { getProjectById } from "@/lib/project-mock-data";

export default function ProjectView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const project = id ? getProjectById(id) : undefined;

  const goBack = () => navigate("/admin?tab=project");

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        <p className="mt-6 text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  const ro = "bg-muted/40";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">View Project</h1>
            <p className="text-sm text-muted-foreground">Project details.</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/admin/project/${project.id}/edit`)}>
          <Pencil className="h-4 w-4 mr-2" />Edit
        </Button>
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
            <Label htmlFor="projectName">Project Name</Label>
            <Input id="projectName" value={project.name} readOnly className={ro} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creationDate">Creation Date</Label>
              <Input id="creationDate" type="date" value={project.creationDate} readOnly className={ro} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creator">Creator</Label>
              <Input id="creator" value={project.owner} readOnly className={ro} />
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
              <Label htmlFor="accountCode">Account Code</Label>
              <Input id="accountCode" value={project.accountCode} readOnly className={ro} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" value={project.accountName} readOnly className={ro} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective Date From</Label>
              <Input id="effectiveFrom" type="date" value={project.effectiveFrom} readOnly className={ro} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveTo">Effective Date To</Label>
              {project.effectiveTo ? (
                <Input id="effectiveTo" type="date" value={project.effectiveTo} readOnly className={ro} />
              ) : (
                <Input id="effectiveTo" value="—" readOnly className={ro} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-10">
        <div className="max-w-4xl mx-auto flex justify-end gap-3 px-6 py-3">
          <Button variant="outline" onClick={goBack}>Back</Button>
        </div>
      </div>
    </div>
  );
}
