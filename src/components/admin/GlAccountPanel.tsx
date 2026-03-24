import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, Pencil, Trash2, Upload, Download, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GlAccountRow {
  id: string;
  expenseType: string;
  accountCode: string;
  accountName: string;
  active: boolean;
  updatedAt: string;
}

const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

const expenseTypeOptions = [
  "Delivery to Customer (Last Mile)",
  "Withholding Tax (1%) to Government",
  "Medicine for Employees",
  "Water Utility",
  "Raw Water Purchase",
  "Waste Collection",
  "Grease Trap & Sewage Pumping",
  "Drain Pipe Unclogging",
  "Lawn Mowing",
  "Landscaping, Trees, Soil for Garden",
  "Electricity",
  "Cleaning Service",
  "Police Donation Box",
  "Land & Building Tax",
  "Radio Advertising",
  "Signage Tax",
  "Advertising on Shuttle Bus",
  "Anniversary Prizes",
  "Accommodation for Canvass Department",
  "Sample Product Delivery for Testing",
  "Vinyl Banner for Promotion",
  "Food & Beverage for HoReCa Customer Visit",
  "Prizes",
  "Decorative Signs for Branch Promotion",
  "Sign Delivery for Wholesale Events",
  "Vinyl Banner for Parade Vehicle Advertising",
  "Computer Expense/Repair — Parts & Components",
  "Computer Consumables",
  "Building Repair & Maintenance",
  "Machinery Repair & Installation",
  "Office Furniture Repair",
  "Office Equipment Repair",
  "Store Equipment Repair",
  "Other Repairs",
  "Pre-Employment Health Check",
  "Outstanding PC Welfare",
  "Wreath Expense",
  "Part-Time Employee Hiring Expense",
  "Intern Health Check",
  "Flower Basket for Customer",
  "Food & Beverage for Stock Count Staff",
  "Travel Expense (Local)",
  "Travel Expense (Overseas)",
  "Vehicle Fuel",
  "Vehicle Repair & Maintenance",
  "Vehicle Tax Renewal",
  "Toll Fees",
  "Store Equipment Rental",
  "Other Equipment Rental",
  "Forklift Rental",
  "Container Rental",
  "Tent Rental",
  "Other Rental",
  "Telephone/Fax",
  "Postal/Courier",
  "Office Supplies & Printing",
  "Other Office Consumables",
  "Tax Surcharge/Penalty",
  "Tax Paid on Behalf of Customer/Lessor",
  "External Seminar Fee",
  "Seminar Food & Beverage",
  "Seminar Travel",
  "Seminar Accommodation",
  "Seminar Room",
  "Bank Fee",
  "Audit Fee",
  "Consulting Fee",
  "Legal Fee",
  "License Fee",
  "Stock Exchange Fee",
  "Store Consumables",
  "Store Consumables — Forklift Fuel",
  "Cold Room Uniform Laundry",
  "Shrine Offering Expense (Flowers, Offerings)",
  "Accommodation for Buffer HO Staff",
];

const initialData: GlAccountRow[] = [
  { id: "1", expenseType: "Delivery to Customer (Last Mile)", accountCode: "6190060001", accountName: "Other Income - Delivery Cost", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "2", expenseType: "Withholding Tax (1%) to Government", accountCode: "2135100004", accountName: "Tax Withheld - Sales", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "3", expenseType: "Medicine for Employees", accountCode: "6110040001", accountName: "Personnel Cost-Sick Pay & physical checkup", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "4", expenseType: "Water Utility", accountCode: "6115010101", accountName: "Establish.Cost-Water", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "5", expenseType: "Waste Collection", accountCode: "6115900001", accountName: "Establish.Cost-Sewage Charge", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "6", expenseType: "Lawn Mowing", accountCode: "6115900002", accountName: "Establishment Cost-Garden Service", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "7", expenseType: "Electricity", accountCode: "6115020201", accountName: "Establish.Cost-Electricity", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "8", expenseType: "Cleaning Service", accountCode: "6115030001", accountName: "Establish.Cost-Cleaning", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "9", expenseType: "Police Donation Box", accountCode: "6115030002", accountName: "Establish.Cost-Security", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "10", expenseType: "Land & Building Tax", accountCode: "6115040001", accountName: "Establishment Cost - Land and Building Tax", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "11", expenseType: "Newspaper Ad for AGM Invitation", accountCode: "6125020001", accountName: "Advertisement-Newspaper", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "12", expenseType: "Radio Advertising", accountCode: "6125020004", accountName: "Advertisement-Public Radio", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "13", expenseType: "Signage Tax", accountCode: "6125020006", accountName: "Advertisement-Signboard Tax", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "14", expenseType: "Advertising on Shuttle Bus", accountCode: "6125020090", accountName: "Advertisement-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "15", expenseType: "Anniversary Prizes", accountCode: "6125040001", accountName: "Promotion-Grand Opening & Anniversary", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "16", expenseType: "Accommodation for Canvass Department", accountCode: "6125040002", accountName: "Promotion-Canvassing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "17", expenseType: "Sample Product Delivery for Testing", accountCode: "6125040004", accountName: "Promotion-Fighting Pro./Sample Product", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "18", expenseType: "Vinyl Banner for Promotion", accountCode: "6125030090", accountName: "PR & CSR - Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "19", expenseType: "Customer Travel for HoReCa Challenge", accountCode: "6125900004", accountName: "Other Sale Promot.-HORECA/MRA Event", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "20", expenseType: "Food & Beverage for HoReCa Customer Visit", accountCode: "6125900006", accountName: "Other Sale Promot.-HORECA customer", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "21", expenseType: "Prizes", accountCode: "6125900007", accountName: "Other Sales Promotion - Customer Develop", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "22", expenseType: "Decorative Signs for Branch Promotion", accountCode: "6125900008", accountName: "Other Sales Promotion - Store Decoration", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "23", expenseType: "Sign Delivery for Wholesale Events", accountCode: "6125900009", accountName: "Other Sales Promotion - MRA", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "24", expenseType: "Vinyl Banner for Parade Vehicle Advertising", accountCode: "6125900090", accountName: "Other Sale Promot.-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "25", expenseType: "Computer Expense/Repair — Parts & Components", accountCode: "6130000007", accountName: "Computer Exp. - Repair Spareparts", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "26", expenseType: "Computer Consumables", accountCode: "6130000008", accountName: "Computer Exp. - Supplies", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "27", expenseType: "Building Repair & Maintenance", accountCode: "6120010001", accountName: "Repair Building", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "28", expenseType: "Machinery Repair & Installation", accountCode: "6120010002", accountName: "Repair Machine & Installation", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "29", expenseType: "Office Furniture Repair", accountCode: "6120010003", accountName: "Repair Office Fur & Fixture", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "30", expenseType: "Office Equipment Repair", accountCode: "6120010004", accountName: "Repair Office Epuipment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "31", expenseType: "Store Equipment Repair", accountCode: "6120010005", accountName: "Repair Plant Equipment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "32", expenseType: "Other Repairs", accountCode: "6120010090", accountName: "Repair Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "33", expenseType: "Pre-Employment Health Check", accountCode: "6190010001", accountName: "Other Personnel Cost-Recruitment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "34", expenseType: "Outstanding PC Welfare", accountCode: "6190010003", accountName: "Other Personnel Cost-Incentive Scheme", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "35", expenseType: "Wreath Expense", accountCode: "6190010090", accountName: "Other Personnel Cost-Other", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "36", expenseType: "Part-Time Employee Hiring Expense", accountCode: "6190010004", accountName: "Oth. Pers. Cost - Part Time", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "37", expenseType: "Intern Health Check", accountCode: "6190010006", accountName: "Oth. Pers. Cost - Trainee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "38", expenseType: "Flower Basket for Customer", accountCode: "6190180001", accountName: "Entertainment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "39", expenseType: "Food & Beverage for Stock Count Staff", accountCode: "6190180002", accountName: "Staff Meeting and Refreshment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "40", expenseType: "Travel Expense (Local)", accountCode: "6190130001", accountName: "Local Travelling", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "41", expenseType: "Travel Expense (Overseas)", accountCode: "6190130002", accountName: "Oversea Travel", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "42", expenseType: "Vehicle Fuel", accountCode: "6190160001", accountName: "Vehicle Running Cost-Fuel", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "43", expenseType: "Vehicle Repair & Maintenance", accountCode: "6190160002", accountName: "Vehicle Running Cost-Maint", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "44", expenseType: "Vehicle Tax Renewal", accountCode: "6190160003", accountName: "Vehicle Running Cost-Registration Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "45", expenseType: "Toll Fees", accountCode: "6190160090", accountName: "Vehicle Running Cost-Other", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "46", expenseType: "Store Equipment Rental", accountCode: "6190200001", accountName: "Hire of Plant Equipment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "47", expenseType: "Other Equipment Rental", accountCode: "6190200002", accountName: "Hire of Other equipment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "48", expenseType: "Forklift Rental", accountCode: "6190200005", accountName: "Hire of Forklift", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "49", expenseType: "Container Rental", accountCode: "6190200006", accountName: "Hire of Container", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "50", expenseType: "Tent Rental", accountCode: "6190200007", accountName: "Hire of Tent", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "51", expenseType: "Other Rental", accountCode: "6190200090", accountName: "Hire of Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "52", expenseType: "Telephone/Fax", accountCode: "6190120001", accountName: "Telephone/Telex/Fax", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "53", expenseType: "Postal/Courier", accountCode: "6190110001", accountName: "Postages & Stamp Duties", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "54", expenseType: "Office Supplies & Printing", accountCode: "6190110002", accountName: "Stationery & Printing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "55", expenseType: "Other Office Consumables", accountCode: "6190110090", accountName: "All Other Office Supplies", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "56", expenseType: "Tax Surcharge/Penalty", accountCode: "6190170003", accountName: "Tax Penalty", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "57", expenseType: "Tax Paid on Behalf of Customer/Lessor", accountCode: "6190170004", accountName: "Tax Paid for Customer", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "58", expenseType: "Pre-Employment Health Check (Pre-Op Branch)", accountCode: "6190040001", accountName: "Pre-op Personnel Exps", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "59", expenseType: "Accommodation for Canvass Department (Pre-Op Branch)", accountCode: "6190040002", accountName: "Pre-op Canvassing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "60", expenseType: "Accommodation (Pre-Op Branch)", accountCode: "6190040005", accountName: "Pre-op General Exps", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "61", expenseType: "Electricity (Pre-Op Branch)", accountCode: "6190040006", accountName: "Pre. - Op. - Establishment Cost", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "62", expenseType: "External Seminar Fee", accountCode: "6190100001", accountName: "Training Cost - Public", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "63", expenseType: "Speaker/Seminar Fee", accountCode: "6190100002", accountName: "Training Cost - Consultation", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "64", expenseType: "Seminar Food & Beverage", accountCode: "6190100003", accountName: "Training Cost - F&B", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "65", expenseType: "Seminar Travel", accountCode: "6190100004", accountName: "Training Cost - Travelling", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "66", expenseType: "Seminar Accommodation", accountCode: "6190100005", accountName: "Training Cost - Accommodation", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "67", expenseType: "Seminar Room", accountCode: "6190100006", accountName: "Training Cost - Conference Room", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "68", expenseType: "Other Seminar Expenses", accountCode: "6190100090", accountName: "Training Cost - Other", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "69", expenseType: "Newspaper/News Subscription", accountCode: "6190900002", accountName: "News/Trade Subscription", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "70", expenseType: "Temple Donation (with Acknowledgment Receipt)", accountCode: "6190190001", accountName: "Charitable Donation(claimed)", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "71", expenseType: "Charitable Donation (No Tax-Deductible Document)", accountCode: "6190190001", accountName: "Charitable Donation(Unclaimed)", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "72", expenseType: "Scholarship (with Thank-You Letter from School)", accountCode: "6190190002", accountName: "Charitable Donation(scholarship)", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "73", expenseType: "Bank Fee", accountCode: "6190070001", accountName: "Bank Charges", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "74", expenseType: "Service Fee (e.g. Volunteer Development Project)", accountCode: "6190900003", accountName: "Service fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "75", expenseType: "Audit Fee", accountCode: "6190030001", accountName: "Audit Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "76", expenseType: "Consulting Fee", accountCode: "6190030002", accountName: "Consultation Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "77", expenseType: "Emergency Expense (e.g. Sandbags, Flood Prevention Equipment)", accountCode: "6190900001", accountName: "Contingency expense", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "78", expenseType: "Accommodation for Staff Development Program", accountCode: "6190900004", accountName: "People Development project", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "79", expenseType: "ค่าจ้างบุคคลภายนอก (Outsource) เช่น ค่าพนักงานบริการยกสินค้า", accountCode: "6190020002", accountName: "Outsourcing Service Fee (Boss/Adecco)", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "80", expenseType: "Legal Fee", accountCode: "6190030003", accountName: "Legal Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "81", expenseType: "License Fee", accountCode: "6190900005", accountName: "Permission Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "82", expenseType: "Stock Exchange Fee", accountCode: "6190030004", accountName: "Fees for SET", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "83", expenseType: "ค่าเบี้ยประกันภัย (ที่ไม่ใช่ประกันชีวิตและอุบัติเหตุ)", accountCode: "6190090001", accountName: "Insurance-Non-Life", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "84", expenseType: "ค่าชดเชยความเสียหายลูกค้า", accountCode: "6190900006", accountName: "Damaged Claims fm Customers", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "85", expenseType: "ค่าขนส่งกระเช้าปีใหม่", accountCode: "6190060002", accountName: "Delivery Charge", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "86", expenseType: "ค่าขนส่ง Transfer สินค้าไปต่างBranch", accountCode: "6190060004", accountName: "Handling Charge", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "87", expenseType: "ผลต่างของเงินสดที่ขาด/เกิน", accountCode: "6190900007", accountName: "Cash Difference", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "88", expenseType: "ค่าใช้จ่ายนับเงินสด", accountCode: "6190900008", accountName: "Cash Counting Costs", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "89", expenseType: "ค่าอุปกรณ์ป้องกันร่างกาย", accountCode: "6190900009", accountName: "Protective Clothing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "90", expenseType: "ค่าแก๊สสำหรับใช้ในโรงอาหาร", accountCode: "6190900010", accountName: "Canteen Cost", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "91", expenseType: "Store Consumables", accountCode: "6190080001", accountName: "Store Supplies", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "92", expenseType: "ค่าน้ำมันเครื่องปั่นไฟ", accountCode: "6190080002", accountName: "Store Supplies-Fuel", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "93", expenseType: "Store Consumables — Forklift Fuel", accountCode: "6190080004", accountName: "Store Suppliers-Fuel Forklift", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "94", expenseType: "ค่าป้ายสำหรับเตือนเรื่องความปลอดภัย", accountCode: "6190900013", accountName: "Other General Exp. - Safety", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "95", expenseType: "Cold Room Uniform Laundry", accountCode: "6190900090", accountName: "Other General Exp-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "96", expenseType: "Shrine Offering Expense (Flowers, Offerings)", accountCode: "6190900090", accountName: "Other non-deductible expenses", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "97", expenseType: "Accommodation for Buffer HO Staff", accountCode: "6190050002", accountName: "Business Developmnet Operation", active: true, updatedAt: "2026-03-23 10:00:00" },
];

let nextId = 98;

export default function GlAccountPanel() {
  const { toast } = useToast();
  const [data, setData] = useState<GlAccountRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<GlAccountRow | null>(null);
  const [formExpenseType, setFormExpenseType] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formActive, setFormActive] = useState(true);

  const [importOpen, setImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ expenseType: string; accountCode: string; accountName: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.accountCode.toLowerCase().includes(q) || r.accountName.toLowerCase().includes(q)
      );
    }
    if (statusFilter === "active") list = list.filter((r) => r.active);
    if (statusFilter === "inactive") list = list.filter((r) => !r.active);
    return list;
  }, [data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditingRow(null);
    setFormExpenseType("");
    setFormCode("");
    setFormName("");
    setFormActive(true);
    setModalOpen(true);
  };

  const openEdit = (row: GlAccountRow) => {
    setEditingRow(row);
    setFormExpenseType(row.expenseType);
    setFormCode(row.accountCode);
    setFormName(row.accountName);
    setFormActive(row.active);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formExpenseType || !formCode.trim() || !formName.trim()) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    const ts = now();
    if (editingRow) {
      setData((prev) =>
        prev.map((r) =>
          r.id === editingRow.id
            ? { ...r, expenseType: formExpenseType, accountCode: formCode.trim(), accountName: formName.trim(), active: formActive, updatedAt: ts }
            : r
        )
      );
      toast({ title: "Updated", description: "GL account updated successfully." });
    } else {
      const newRow: GlAccountRow = {
        id: String(nextId++),
        expenseType: formExpenseType,
        accountCode: formCode.trim(),
        accountName: formName.trim(),
        active: formActive,
        updatedAt: ts,
      };
      setData((prev) => [...prev, newRow]);
      toast({ title: "Created", description: "GL account added successfully." });
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Deleted", description: "GL account removed." });
  };

  const handleToggle = (id: string, checked: boolean) => {
    setData((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: checked, updatedAt: now() } : r))
    );
  };

  const downloadTemplate = () => {
    const csv = "expense_type,account_code,account_name\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gl_account_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const rows = lines.slice(1).map((line) => {
        const [expenseType = "", accountCode = "", accountName = ""] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        return { expenseType, accountCode, accountName };
      }).filter((r) => r.expenseType && r.accountCode && r.accountName);
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    const ts = now();
    const newRows: GlAccountRow[] = csvPreview.map((r) => ({
      id: String(nextId++),
      expenseType: r.expenseType,
      accountCode: r.accountCode,
      accountName: r.accountName,
      active: true,
      updatedAt: ts,
    }));
    setData((prev) => [...prev, ...newRows]);
    toast({ title: "Imported", description: `${newRows.length} GL accounts imported.` });
    setCsvPreview([]);
    setImportOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">GL Account</h2>
          <p className="text-sm text-muted-foreground">
            Manage GL account codes and their mapped expense types.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setCsvPreview([]); setImportOpen(true); }}>
            <Upload className="h-4 w-4 mr-2" />Import CSV
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />Add GL Account
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search account code or account name..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense Type</TableHead>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No GL accounts found
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.expenseType}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.accountCode}</code></TableCell>
                  <TableCell>{row.accountName}</TableCell>
                  <TableCell>
                    <Switch
                      checked={row.active}
                      onCheckedChange={(checked) => handleToggle(row.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(row)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(row.id)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">{page} / {totalPages}</span>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit GL Account" : "Add GL Account"}</DialogTitle>
            <DialogDescription>
              {editingRow ? "Update the GL account details below." : "Fill in the details to create a new GL account."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Expense Type <span className="text-destructive">*</span></Label>
              <Select value={formExpenseType} onValueChange={setFormExpenseType}>
                <SelectTrigger><SelectValue placeholder="Select expense type" /></SelectTrigger>
                <SelectContent>
                  {expenseTypeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountCode">Account Code <span className="text-destructive">*</span></Label>
              <Input id="accountCode" value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="e.g. 5101001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name <span className="text-destructive">*</span></Label>
              <Input id="accountName" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Local Travelling" />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="activeToggle">Active</Label>
              <Switch id="activeToggle" checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import GL Accounts from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file to bulk-import GL accounts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />Download Template
            </Button>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="gl-csv-upload"
              />
              <label htmlFor="gl-csv-upload" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <span>Click to upload or drag & drop a CSV file</span>
              </label>
            </div>

            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{csvPreview.length} rows parsed</p>
                <div className="max-h-48 overflow-auto border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expense Type</TableHead>
                        <TableHead>Account Code</TableHead>
                        <TableHead>Account Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{r.expenseType}</TableCell>
                          <TableCell className="text-sm">{r.accountCode}</TableCell>
                          <TableCell className="text-sm">{r.accountName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={confirmImport} disabled={csvPreview.length === 0}>
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
