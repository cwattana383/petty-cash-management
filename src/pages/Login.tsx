import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const demoAccounts = [
  { role: "CWA", email: "cwa@cpaxtra.co.th", pw: "1234" },
  { role: "Branch", email: "branch@makro.com", pw: "password123" },
  { role: "Head Office", email: "headoffice@makro.com", note: "MFA" },
  { role: "Admin", email: "admin@makro.com", note: "MFA" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", email);
      navigate("/claims");
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-lg p-8 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">makro</h1>
          <h2 className="text-xl font-bold text-foreground">Welcome back</h2>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-semibold">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-semibold">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="text-right">
              <button type="button" className="text-sm font-semibold text-destructive hover:underline">
                Forgot password?
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-bold bg-destructive hover:bg-destructive/90 text-white rounded-lg" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs uppercase text-muted-foreground tracking-wider">Or continue with</span>
          </div>
        </div>

        {/* SSO Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "OAuth2" },
            { label: "SAML" },
            { label: "Okta", icon: Key },
          ].map((btn) => (
            <Button key={btn.label} variant="outline" className="h-11 font-medium" type="button">
              {btn.icon && <btn.icon className="h-4 w-4 mr-1.5" />}
              {btn.label}
            </Button>
          ))}
        </div>

        {/* Demo Accounts */}
        <div className="bg-muted/60 rounded-xl p-4 space-y-1.5">
          <p className="text-sm font-bold text-center text-foreground">Demo Accounts</p>
          {demoAccounts.map((a) => (
            <p key={a.email} className="text-xs text-muted-foreground">
              {a.role}: <span className="font-medium">{a.email}</span>
              {a.pw && ` (pw: ${a.pw})`}
              {a.note && ` (${a.note})`}
            </p>
          ))}
          <p className="text-xs text-muted-foreground">Password: password123</p>
        </div>
      </div>
    </div>
  );
}
