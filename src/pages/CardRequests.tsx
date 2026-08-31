import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const RED = "#DA3832";

export default function CardRequests() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 rounded-xl p-4" style={{ backgroundColor: "#F5F6F7" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Card Requests</h2>
          <p className="text-sm text-muted-foreground">Corporate Credit Card &amp; Fleet Card — Card Request / คำขอบัตร</p>
        </div>
        <Button onClick={() => navigate("/card-requests/new")} style={{ backgroundColor: RED, color: "#fff" }}>
          New Card Request
        </Button>
      </div>
    </div>
  );
}
