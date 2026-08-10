import { useNavigate, useParams } from "react-router-dom";
import CardManagementForm from "@/components/admin/CardManagementForm";
import CardManagementList from "@/components/admin/CardManagementList";
import { CARD_MASTER_ROWS } from "@/lib/card-master-mock-data";

export default function CardManagement() {
  const { cardId } = useParams();
  const navigate = useNavigate();

  if (!cardId) return <CardManagementList />;

  const row = cardId === "new" ? undefined : CARD_MASTER_ROWS.find((r) => r.cardId === cardId);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => navigate("/admin/card-management")}
        className="text-sm font-medium"
        style={{ color: "#306FC7" }}
      >
        ← กลับไปหน้ารายการบัตร
      </button>
      <CardManagementForm
        record={
          cardId === "new"
            ? undefined
            : {
                cardId,
                cardType: row?.kind === "fleet" ? "Fleet Card" : "Corporate Credit Card",
                last4: row?.last4,
                cardholderName: row?.cardholderName,
                employeeId: row?.employeeId,
                expiry: row?.expiry,
                cardStatus: row?.status,
                company: row?.company,
                creditLimit: row?.creditLimit?.toLocaleString("en-US"),
                plateNo: row?.plateNo,
              }
        }
      />
    </div>
  );
}
