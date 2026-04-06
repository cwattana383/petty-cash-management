import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MailPlus, CheckCircle2, AlertCircle, Loader2, UserPlus } from "lucide-react";
import { useInviteEmployee } from "@/hooks/use-employees";

interface InviteUserDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteUserDialog({ open, onClose }: InviteUserDialogProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const invite = useInviteEmployee();

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSend = () => {
    if (!email.trim()) {
      setEmailError("Please enter an email address.");
      return;
    }
    if (!isValidEmail(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    invite.mutate(email.trim());
  };

  const handleClose = () => {
    setEmail("");
    setEmailError("");
    invite.reset();
    onClose();
  };

  const handleAddEmployee = () => {
    const entraId = result?.entraObjectId || '';
    handleClose();
    navigate(`/admin/employee/create?email=${encodeURIComponent(email.trim())}${entraId ? `&entraObjectId=${encodeURIComponent(entraId)}` : ''}`);
  };

  const result = invite.data;
  const isDone = invite.isSuccess;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MailPlus className="h-5 w-5 text-primary" />
            Invite User
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isDone && (
            <div className="space-y-2">
              <Label htmlFor="invite-email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="e.g. employee@cpaxtra.co.th"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                disabled={invite.isPending}
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                An invitation email will be sent to this address. The employee
                must use their Microsoft 365 corporate account to sign in.
              </p>
            </div>
          )}

          {/* Success — invited */}
          {isDone && result?.status === "invited" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-medium mb-1">Invitation sent to <span className="font-bold">{email}</span></p>
                {result.emailSent ? (
                  <p className="text-sm">An invitation email has been sent. Once they accept, add their profile below.</p>
                ) : (
                  <p className="text-sm">Email could not be sent automatically — please notify the employee manually. You can still add their profile now.</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Already in directory but not in project — prompt to add */}
          {isDone && result?.status === "already_exists" && result.entraObjectId && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <p className="font-medium mb-1">User Already Exists</p>
                <p className="text-sm">
                  <span className="font-bold">{email}</span> is already in the directory.
                  Fill in the remaining details to add them.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Already added in the project */}
          {isDone && result?.status === "already_exists" && !result.entraObjectId && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <p className="font-medium mb-1">Already Added</p>
                <p className="text-sm">
                  <span className="font-bold">{email}</span> is already added in the project.
                  You can edit their profile from the employee list.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Error */}
          {invite.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Invitation failed</p>
                <p className="text-sm">
                  {(invite.error as Error)?.message || "Failed to send invitation. Please try again."}
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {isDone ? "Close" : "Cancel"}
          </Button>

          {!isDone && (
            <Button onClick={handleSend} disabled={invite.isPending}>
              {invite.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
              ) : (
                <><MailPlus className="h-4 w-4 mr-2" />Send Invitation</>
              )}
            </Button>
          )}

          {isDone && (result?.status === "invited" || (result?.status === "already_exists" && result.entraObjectId)) && (
            <Button onClick={handleAddEmployee}>
              <UserPlus className="h-4 w-4 mr-2" />Add Employee Profile
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
