import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, UserPlus } from "lucide-react";

interface InviteUserDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteUserDialog({ open, onClose }: InviteUserDialogProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setEmail("");
    setSending(false);
    setSent(false);
    setError("");
    onClose();
  };

  const handleSend = () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 500);
  };

  const handleAddProfile = () => {
    handleClose();
    navigate(`/admin/employee/create?email=${encodeURIComponent(email)}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Invitation sent to <span className="font-medium text-foreground">{email}</span>
            </p>
            <Button onClick={handleAddProfile} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee Profile
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Invitation
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
