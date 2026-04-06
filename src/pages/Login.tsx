import { useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { Navigate } from "react-router-dom";
import { demoAccounts } from "@/lib/mock-data";

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // If already authenticated, redirect to claims
  if (isAuthenticated) {
    return <Navigate to="/claims" replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = login(email.trim(), password);
    if (!success) {
      setError("Invalid email or password. Try one of the demo accounts below.");
    } else {
      window.location.href = "/claims";
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    const success = login(demoEmail, "demo");
    if (success) {
      window.location.href = "/claims";
    }
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

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-3">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 text-center">
              {error}
            </div>
          )}
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
          <Button
            type="submit"
            disabled={!email.trim() || !password}
            className="w-full h-12 text-base font-bold rounded-lg"
          >
            Sign In
          </Button>
        </form>

        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>Demo Mode — No Azure AD Required</span>
        </div>

        {/* Quick demo login buttons */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Quick Login</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acct) => (
              <Button
                key={acct.email}
                variant="outline"
                size="sm"
                className="text-xs h-9"
                onClick={() => handleQuickLogin(acct.email)}
              >
                {acct.label}
              </Button>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Password for all demo accounts: <code className="font-mono bg-muted px-1 rounded">demo</code>
          </p>
        </div>
      </div>
    </div>
  );
}
