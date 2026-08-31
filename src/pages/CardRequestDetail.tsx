import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CardRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div className="space-y-4 rounded-xl p-4" style={{ backgroundColor: "#F5F6F7" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Card Request {id}</h2>
        </div>
        <Button variant="outline" onClick={() => navigate("/card-requests")}>
          Back
        </Button>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">Coming soon</CardContent>
      </Card>
    </div>
  );
}
