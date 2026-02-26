import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleMicrosoftLogin = () => {
    setLoading(true);
    // Mock: simulate Azure AD redirect
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", "user@makro.com");
      localStorage.setItem("authProvider", "AZURE_AD");
      navigate("/claims");
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-lg p-8 space-y-8">
        {/* Brand */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold text-destructive tracking-tight">makro</h1>
          <h2 className="text-xl font-bold text-foreground">Welcome back</h2>
          <p className="text-sm text-muted-foreground">Corporate Card Expense Management</p>
        </div>

        {/* Microsoft SSO */}
        <div className="space-y-4">
          <Button
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full h-12 text-base font-bold rounded-lg gap-3"
          >
            <svg viewBox="0 0 21 21" className="h-5 w-5 shrink-0" aria-hidden="true">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            {loading ? "Redirecting to Microsoft..." : "Sign in with Microsoft 365"}
          </Button>

          <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Secured by Azure Active Directory</span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-muted/60 rounded-xl p-4 space-y-2 text-center">
          <p className="text-xs text-muted-foreground">
            Use your corporate Microsoft 365 account to sign in.
          </p>
          <p className="text-xs text-muted-foreground">
            Multi-factor authentication may be required by your organization.
          </p>
        </div>
      </div>
    </div>
  );
}
