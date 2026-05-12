import { XCircle, MessageCircle, Building, Lock } from "lucide-react";
import { ClaimHeader } from "@/lib/types";
import { formatBEDate } from "@/lib/utils";
import { users } from "@/lib/mock-data";

interface ResponsePanelProps {
  claim: ClaimHeader;
}

type PanelStatus = "Reject" | "Returned For Info" | "Returned By Finance" | "Final Rejected";

const CONFIG: Record<
  PanelStatus,
  {
    border: string;
    bg: string;
    iconBg: string;
    titleColor: string;
    Icon: typeof XCircle;
    title: string;
  }
> = {
  Reject: {
    border: "border-[#E11D2C]",
    bg: "bg-[#FEE7EA]",
    iconBg: "bg-[#E11D2C]",
    titleColor: "text-[#991B1B]",
    Icon: XCircle,
    title: "Your manager rejected this claim",
  },
  "Returned For Info": {
    border: "border-[#D97706]",
    bg: "bg-[#FFFBEB]",
    iconBg: "bg-[#D97706]",
    titleColor: "text-[#92400E]",
    Icon: MessageCircle,
    title: "Manager requested more information",
  },
  "Returned By Finance": {
    border: "border-[#7C3AED]",
    bg: "bg-[#FAF5FF]",
    iconBg: "bg-[#7C3AED]",
    titleColor: "text-[#5B21B6]",
    Icon: Building,
    title: "Finance returned this claim for correction",
  },
  "Final Rejected": {
    border: "border-[#1F2937]",
    bg: "bg-[#F3F4F6]",
    iconBg: "bg-[#1F2937]",
    titleColor: "text-[#1F2937]",
    Icon: Lock,
    title: "This claim has been permanently rejected",
  },
};

function isPanelStatus(s: string): s is PanelStatus {
  return s === "Reject" || s === "Returned For Info" || s === "Returned By Finance" || s === "Final Rejected";
}

export function ResponsePanel({ claim }: ResponsePanelProps) {
  if (!isPanelStatus(claim.status)) return null;

  const cfg = CONFIG[claim.status];
  const { Icon } = cfg;

  let returnerName = "";
  if (claim.returnedByUserId) {
    const u = users.find((x) => x.id === claim.returnedByUserId);
    if (u) returnerName = u.name;
  }
  if (!returnerName) {
    if (claim.returnSource === "FINANCE_RETURN") returnerName = "Finance Team";
    else returnerName = "Manager";
  }

  const dateStr = claim.returnedAt ? formatBEDate(claim.returnedAt) : "";

  const attempt = (claim.resubmitCountMgr ?? 0) + 1;

  return (
    <div className={`rounded-lg p-5 mb-4 border-l-4 ${cfg.border} ${cfg.bg}`}>
      <div className="flex gap-4">
        <div
          className={`${cfg.iconBg} rounded-full flex items-center justify-center shrink-0`}
          style={{ width: 38, height: 38 }}
        >
          <Icon className="text-white" width={22} height={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm ${cfg.titleColor}`}>{cfg.title}</div>

          {claim.returnMessage ? (
            <div className="mt-2 rounded-md bg-white/55 p-2 text-sm italic text-gray-700">
              {claim.returnMessage}
            </div>
          ) : null}

          <div className="mt-2 text-xs text-gray-500 flex items-center flex-wrap gap-x-2 gap-y-1">
            <span>{returnerName}</span>
            {dateStr && (
              <>
                <span>·</span>
                <span>{dateStr}</span>
              </>
            )}
            {claim.status === "Reject" && (
              <span className="ml-2 inline-flex items-center rounded-full border border-[#E11D2C] text-[#E11D2C] px-2 py-0.5 text-[11px]">
                Attempt {attempt} of 2
              </span>
            )}
            {claim.status === "Final Rejected" && (
              <span className="ml-2 inline-flex items-center rounded-full bg-slate-700 text-white px-2 py-0.5 text-[11px]">
                Final — Attempt 2 of 2
              </span>
            )}
          </div>

          {claim.status === "Final Rejected" && (
            <div className="mt-1 text-xs text-gray-600">
              No further action is available. To dispute this decision, contact Finance Officer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResponsePanel;
