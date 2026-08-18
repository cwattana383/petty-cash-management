import { useState } from "react";
import { Trash2, UserCog, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Assistant {
  name: string;
  employeeCode: string;
}

interface Props {
  cardholderName?: string;
  assistants?: Assistant[];
  onAdd?: (assistant: Assistant) => void;
  onRemove?: (index: number) => void;
}

const SEED: Assistant[] = [{ name: "test test", employeeCode: "3243534" }];

export default function DelegatedAccessTab({ assistants, onAdd, onRemove }: Props) {
  const [internal, setInternal] = useState<Assistant[]>(SEED);
  const rows = assistants ?? internal;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Assistant>({ name: "", employeeCode: "" });

  const openAdd = () => {
    setForm({ name: "", employeeCode: "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (onAdd) onAdd(form);
    else setInternal((prev) => [...prev, form]);
    setDialogOpen(false);
  };

  const confirmRemove = () => {
    if (removeIndex === null) return;
    if (onRemove) onRemove(removeIndex);
    else setInternal((prev) => prev.filter((_, i) => i !== removeIndex));
    setRemoveIndex(null);
  };

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <UserCog className="h-5 w-5" style={{ color: "#DA3832" }} />
            Assistant Information
          </CardTitle>
          <Button
            type="button"
            onClick={openAdd}
            className="shrink-0 text-white hover:opacity-90"
            style={{ backgroundColor: "#DA3832" }}
          >
            <Plus className="h-4 w-4" />
            Add Assistant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-medium text-muted-foreground">Assistant</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Employee Code</TableHead>
              <TableHead className="text-right text-xs font-medium text-muted-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  No assistants added yet. Click + Add Assistant to add one.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={`${row.employeeCode}-${index}`}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.employeeCode}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove assistant"
                      onClick={() => setRemoveIndex(index)}
                    >
                      <Trash2 className="h-4 w-4" style={{ color: "#DA3832" }} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Assistant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assistant-name">Assistant Name</Label>
              <Input
                id="assistant-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assistant-code">Employee Code</Label>
              <Input
                id="assistant-code"
                value={form.employeeCode}
                onChange={(e) => setForm((p) => ({ ...p, employeeCode: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeIndex !== null} onOpenChange={(open) => !open && setRemoveIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this assistant?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
