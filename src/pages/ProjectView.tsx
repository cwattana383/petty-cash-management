import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil, FolderOpen } from "lucide-react";
import { getProjectById } from "@/lib/project-mock-data";

function formatDateBE(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y) return "—";
  return `${d}/${m}/${Number(y) + 543}`;
}

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

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value || "—"}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Project Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Row label="Project Name" value={project.name} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Row label="Creation Date" value={formatDateBE(project.creationDate)} />
            <Row label="Creator" value={project.owner} />
            <Row label="Account Code" value={project.accountCode} />
            <Row label="Account Name" value={project.accountName} />
            <Row label="Effective Date From" value={formatDateBE(project.effectiveFrom)} />
            <Row label="Effective Date To" value={formatDateBE(project.effectiveTo)} />
          </div>
          <Row
            label="Status"
            value={
              project.active ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Active</Badge>
              ) : (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">Inactive</Badge>
              )
            }
          />
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-10">
        <div className="max-w-4xl mx-auto flex justify-end gap-3 px-6 py-3">
          <Button variant="outline" onClick={goBack}>Back</Button>
        </div>
      </div>
    </div>
  );
}
