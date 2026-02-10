import React, { createContext, useContext, useState, useCallback } from "react";
import { ClaimHeader, ClaimLine, ClaimStatus } from "./types";
import { mockClaims } from "./mock-data";

interface ClaimsContextType {
  claims: ClaimHeader[];
  addClaim: (claim: ClaimHeader) => void;
  updateClaim: (id: string, updates: Partial<ClaimHeader>) => void;
  deleteClaim: (id: string) => void;
  getClaimById: (id: string) => ClaimHeader | undefined;
  nextClaimNo: () => string;
}

const ClaimsContext = createContext<ClaimsContextType | null>(null);

export function ClaimsProvider({ children }: { children: React.ReactNode }) {
  const [claims, setClaims] = useState<ClaimHeader[]>(mockClaims);

  const addClaim = useCallback((claim: ClaimHeader) => {
    setClaims((prev) => [claim, ...prev]);
  }, []);

  const updateClaim = useCallback((id: string, updates: Partial<ClaimHeader>) => {
    setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteClaim = useCallback((id: string) => {
    setClaims((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getClaimById = useCallback((id: string) => claims.find((c) => c.id === id), [claims]);

  const nextClaimNo = useCallback(() => {
    const year = new Date().getFullYear();
    const maxNum = claims
      .filter((c) => c.claimNo.startsWith(`EC-${year}`))
      .reduce((max, c) => {
        const num = parseInt(c.claimNo.split("-")[2], 10);
        return num > max ? num : max;
      }, 0);
    return `EC-${year}-${String(maxNum + 1).padStart(3, "0")}`;
  }, [claims]);

  return (
    <ClaimsContext.Provider value={{ claims, addClaim, updateClaim, deleteClaim, getClaimById, nextClaimNo }}>
      {children}
    </ClaimsContext.Provider>
  );
}

export function useClaims() {
  const ctx = useContext(ClaimsContext);
  if (!ctx) throw new Error("useClaims must be used within ClaimsProvider");
  return ctx;
}
