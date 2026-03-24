import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

interface ExpenseTypeRow {
  id: string;
  groupingTh: string;
  subExpenseType: string;
  accountNameEn: string;
  active: boolean;
  updatedAt: string;
}

const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

const initialData: ExpenseTypeRow[] = [
  { id: "1", groupingTh: "ค่าขนส่ง ส่งของให้ลูกค้า (Last Mile)", subExpenseType: "Courier / Postage", accountNameEn: "Other Income - Delivery Cost", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "2", groupingTh: "จ่าย ภาษีหัก ณ ที่จ่าย (1%) ให้แก่หน่วยงานราชการ", subExpenseType: "Government License / Permit", accountNameEn: "Tax Withheld - Sales", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "3", groupingTh: "ค่ายา สำหรับให้พนักงานใช้", subExpenseType: "Medical / OPD", accountNameEn: "Personnel Cost-Sick Pay & physical checkup", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "4", groupingTh: "ค่าน้ำประปา", subExpenseType: "", accountNameEn: "Establish.Cost-Water", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "5", groupingTh: "ค่าซื้อน้ำดิบ", subExpenseType: "", accountNameEn: "Establish.Cost-Water", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "6", groupingTh: "ค่าเก็บขยะ", subExpenseType: "Wet Waste Disposal", accountNameEn: "Establish.Cost-Sewage Charge", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "7", groupingTh: "ค่าดูดไขมันและสูบสิ่งปฏิกูล", subExpenseType: "Wet Waste Disposal", accountNameEn: "Establish.Cost-Sewage Charge", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "8", groupingTh: "ค่าทะลวงท่อระบายน้ำอุดตัน", subExpenseType: "", accountNameEn: "Establish.Cost-Sewage Charge", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "9", groupingTh: "ค่าตัดหญ้า", subExpenseType: "", accountNameEn: "Establishment Cost-Garden Service", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "10", groupingTh: "ค่าอุปกรณ์ตัดแต่งกิ่งไม้ เพื่อดูแลสวนในสาขา", subExpenseType: "", accountNameEn: "Establishment Cost-Garden Service", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "11", groupingTh: "ค่าจัดสวน, ค่าต้นไม้, ค่าดิน สำหรับตกแต่งสวน", subExpenseType: "", accountNameEn: "Establishment Cost-Garden Service", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "12", groupingTh: "ค่าไฟ", subExpenseType: "", accountNameEn: "Establish.Cost-Electricity", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "13", groupingTh: "ค่าไฟป้ายทางเข้า", subExpenseType: "", accountNameEn: "Establish.Cost-Electricity", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "14", groupingTh: "ค่าทำความสะอาด", subExpenseType: "", accountNameEn: "Establish.Cost-Cleaning", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "15", groupingTh: "ค่าตู้แดง (ตำรวจ)", subExpenseType: "", accountNameEn: "Establish.Cost-Security", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "16", groupingTh: "ค่าภาษีที่ดิน และ สิ่งปลูกสร้าง", subExpenseType: "Government License / Permit", accountNameEn: "Establishment Cost - Land and Building Tax", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "17", groupingTh: "ค่าลงโฆษณาในหนังสือพิมพ์ เชิญประชุมสามัญผู้ถือหุ้น", subExpenseType: "", accountNameEn: "Advertisement-Newspaper", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "18", groupingTh: "ค่าลงโฆษณาในหนังสือพิมพ์ การจ่ายเงินปันผล และงบการเงิน ของบริษัท", subExpenseType: "", accountNameEn: "Advertisement-Newspaper", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "19", groupingTh: "ค่าโฆษณาทางวิทยุ", subExpenseType: "", accountNameEn: "Advertisement-Public Radio", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "20", groupingTh: "ค่าภาษีป้าย", subExpenseType: "", accountNameEn: "Advertisement-Signboard Tax", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "21", groupingTh: "ค่าโฆษณา ป้ายติดรถสองแถว", subExpenseType: "", accountNameEn: "Advertisement-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "22", groupingTh: "ค่าป้ายแนะนำ ในเขตทางหลวง", subExpenseType: "", accountNameEn: "Advertisement-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "23", groupingTh: "ค่าเช่าป้าย highway sign", subExpenseType: "", accountNameEn: "Advertisement-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "24", groupingTh: "ค่าอุปกรณ์ ฉลองวันครบรอบสาขา", subExpenseType: "", accountNameEn: "Promotion-Grand Opening & Anniversary", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "25", groupingTh: "ค่าป้าย ฉลองวันครบรอบสาขา", subExpenseType: "", accountNameEn: "Promotion-Grand Opening & Anniversary", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "26", groupingTh: "ค่าของรางวัลวันครบรอบแม็คโคร", subExpenseType: "", accountNameEn: "Promotion-Grand Opening & Anniversary", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "27", groupingTh: "ค่าที่พักในการออกหาสมาชิกของแผนก Canvass", subExpenseType: "Hotel — Domestic", accountNameEn: "Promotion-Canvassing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "28", groupingTh: "ค่าเดินทางในการออกหาสมาชิกของแผนก Canvass", subExpenseType: "Taxi / Grab", accountNameEn: "Promotion-Canvassing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "29", groupingTh: "ค่าใช้จ่ายในการออกบูธของแผนก Canvass", subExpenseType: "", accountNameEn: "Promotion-Canvassing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "30", groupingTh: "ค่าขนส่งสินค้าตัวอย่างเพื่อเทสสินค้า", subExpenseType: "Courier / Postage", accountNameEn: "Promotion-Fighting Pro./Sample Product", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "31", groupingTh: "ค่าซื้อสินค้าตัวอย่าง", subExpenseType: "", accountNameEn: "Promotion-Fighting Pro./Sample Product", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "32", groupingTh: "ค่าซื้ออุปกรณ์สำหรับจัดสินค้าตัวอย่าง", subExpenseType: "", accountNameEn: "Promotion-Fighting Pro./Sample Product", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "33", groupingTh: "ซื้อสินค้า เพื่อจัดบูธ", subExpenseType: "", accountNameEn: "Promotion-Fighting Pro./Sample Product", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "34", groupingTh: "ค่าป้ายไวนิล เพื่อประชาสัมพันธ์", subExpenseType: "", accountNameEn: "PR & CSR - Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "35", groupingTh: "ค่าใช้จ่ายงานประชาสัมพันธ์", subExpenseType: "", accountNameEn: "PR & CSR - Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "36", groupingTh: "ค่าเดินทางพาลูกค้าไปเข้าร่วมแข่งขัน Horeca challenge", subExpenseType: "Client Entertainment", accountNameEn: "Other Sale Promot.-HORECA/MRA Event", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "37", groupingTh: "ค่าทำป้ายล้อมกองงาน Horeca", subExpenseType: "", accountNameEn: "Other Sale Promot.-HORECA/MRA Event", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "38", groupingTh: "ค่าอุปกรณ์ใช้ในการจัดงาน Horeca", subExpenseType: "", accountNameEn: "Other Sale Promot.-HORECA/MRA Event", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "39", groupingTh: "ค่าอาหารและเครื่องดื่ม Visit ลูกค้า Horeca", subExpenseType: "Client Entertainment", accountNameEn: "Other Sale Promot.-HORECA customer", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "40", groupingTh: "ค่าของรางวัล", subExpenseType: "", accountNameEn: "Other Sales Promotion - Customer Develop", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "41", groupingTh: "ค่าป้ายตกแต่ง สำหรับโปรโมชั่นสาขา", subExpenseType: "", accountNameEn: "Other Sales Promotion - Store Decoration", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "42", groupingTh: "ค่าอุปกรณ์ตกแต่ง สำหรับโปรโมชั่นสาขา", subExpenseType: "", accountNameEn: "Other Sales Promotion - Store Decoration", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "43", groupingTh: "ค่าสติ๊กเกอร์ตกแต่ง สำหรับโปรโมชั่นสาขา", subExpenseType: "", accountNameEn: "Other Sales Promotion - Store Decoration", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "44", groupingTh: "ค่าขนส่งป้าย งานโชห่วย", subExpenseType: "Courier / Postage", accountNameEn: "Other Sales Promotion - MRA", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "45", groupingTh: "ค่าอุปกรณ์ตกแต่ง งานโชห่วย", subExpenseType: "", accountNameEn: "Other Sales Promotion - MRA", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "46", groupingTh: "ค่าเดินทาง งานโชห่วย", subExpenseType: "Taxi / Grab", accountNameEn: "Other Sales Promotion - MRA", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "47", groupingTh: "ค่าทำป้ายไวนิล สำหรับติดตั้งกับรถแห่เพื่อประชาสัมพันธ์", subExpenseType: "", accountNameEn: "Other Sale Promot.-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "48", groupingTh: "ค่าจ้างนักดนตรีแสดงใน Eatery", subExpenseType: "", accountNameEn: "Other Sale Promot.-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "49", groupingTh: "ค่าบริการอินเตอร์เน็ต 3BB", subExpenseType: "", accountNameEn: "Other Sale Promot.-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "50", groupingTh: "ค่าใช้จ่ายคอมพิวเตอร์/ซ่อม-อะไหล่,ชิ้นส่วนประกอบ", subExpenseType: "IT Equipment", accountNameEn: "Computer Exp. - Repair Spareparts", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "51", groupingTh: "ค่าใช้จ่ายคอมพิวเตอร์-วัสดุสิ้นเปลือง", subExpenseType: "IT Equipment", accountNameEn: "Computer Exp. - Supplies", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "52", groupingTh: "ค่าซ่อมแซม-บำรุงรักษาอาคาร", subExpenseType: "", accountNameEn: "Repair Building", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "53", groupingTh: "ค่าซ่อมแซม-เครื่องจักรพร้อมการติดตั้ง", subExpenseType: "", accountNameEn: "Repair Machine & Installation", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "54", groupingTh: "ค่าซ่อมแซม-เครื่องตกแต่งสำนักงาน", subExpenseType: "", accountNameEn: "Repair Office Fur & Fixture", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "55", groupingTh: "ค่าซ่อมแซม-อุปกรณ์ในสำนักงาน", subExpenseType: "", accountNameEn: "Repair Office Epuipment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "56", groupingTh: "ค่าซ่อมแซม-อุปกรณ์ในร้านค้า", subExpenseType: "", accountNameEn: "Repair Plant Equipment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "57", groupingTh: "ค่าซ่อมแซม-อื่น ๆ", subExpenseType: "", accountNameEn: "Repair Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "58", groupingTh: "ค่าตรวจสุขภาพก่อนเริ่มงาน", subExpenseType: "Medical / OPD", accountNameEn: "Other Personnel Cost-Recruitment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "59", groupingTh: "สวัสดิการ PC ดีเด่น", subExpenseType: "", accountNameEn: "Other Personnel Cost-Incentive Scheme", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "60", groupingTh: "ค่าพวงหรีด", subExpenseType: "Funeral — Wreath (พวงหรีด)", accountNameEn: "Other Personnel Cost-Other", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "61", groupingTh: "ค่าใช้จ่ายจ้างพนักงาน Part Time", subExpenseType: "", accountNameEn: "Oth. Pers. Cost - Part Time", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "62", groupingTh: "ค่าตรวจสุขภาพ พนักงานฝึกงาน", subExpenseType: "Medical / OPD", accountNameEn: "Oth. Pers. Cost - Trainee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "63", groupingTh: "ค่ากระเช้าดอกไม้ให้ลูกค้า", subExpenseType: "Client Entertainment", accountNameEn: "Entertainment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "64", groupingTh: "ค่าอาหาร เครื่องดื่มพนักงานนับสต็อค", subExpenseType: "Night Shift Meal (60/person)", accountNameEn: "Staff Meeting and Refreshment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "65", groupingTh: "ค่าเดินทาง (Local)", subExpenseType: "Taxi / Grab", accountNameEn: "Local Travelling", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "66", groupingTh: "ค่าเดินทาง (Oversea)", subExpenseType: "Ground Transport (Overseas)", accountNameEn: "Oversea Travel", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "67", groupingTh: "ค่าน้ำมันสำหรับยานพาหนะ", subExpenseType: "Personal Car — Mileage", accountNameEn: "Vehicle Running Cost-Fuel", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "68", groupingTh: "ค่าใช้จ่ายซ่อมบำรุงยานพาหนะ", subExpenseType: "", accountNameEn: "Vehicle Running Cost-Maint", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "69", groupingTh: "ค่าต่อภาษีรถยนต์", subExpenseType: "Government License / Permit", accountNameEn: "Vehicle Running Cost-Registration Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "70", groupingTh: "ค่าทางด่วน", subExpenseType: "Toll Fees / ค่าทางด่วน", accountNameEn: "Vehicle Running Cost-Other", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "71", groupingTh: "ค่าเช่าอุปกรณ์ร้านค้า", subExpenseType: "", accountNameEn: "Hire of Plant Equipment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "72", groupingTh: "ค่าเช่าเครื่องใช้อื่น ๆ", subExpenseType: "", accountNameEn: "Hire of Other equipment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "73", groupingTh: "ค่าเช่า Forklift", subExpenseType: "", accountNameEn: "Hire of Forklift", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "74", groupingTh: "ค่าเช่า Container", subExpenseType: "", accountNameEn: "Hire of Container", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "75", groupingTh: "ค่าเช่าเต็นท์", subExpenseType: "", accountNameEn: "Hire of Tent", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "76", groupingTh: "ค่าเช่าอื่น ๆ", subExpenseType: "", accountNameEn: "Hire of Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "77", groupingTh: "ค่าโทรศัพท์/โทรสาร", subExpenseType: "", accountNameEn: "Telephone/Telex/Fax", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "78", groupingTh: "ค่าส่งไปรษณี", subExpenseType: "Courier / Postage", accountNameEn: "Postages & Stamp Duties", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "79", groupingTh: "ค่าวัสดุสำนักงานและสิ่งพิมพ์", subExpenseType: "Stationery / Printing", accountNameEn: "Stationery & Printing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "80", groupingTh: "วัสดุสิ้นเปลืองสำนักงาน-อื่น ๆ", subExpenseType: "Stationery / Printing", accountNameEn: "All Other Office Supplies", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "81", groupingTh: "เงินเพิ่ม/เบี้ยปรับภาษี", subExpenseType: "", accountNameEn: "Tax Penalty", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "82", groupingTh: "ภาษีจ่ายแทนลูกค้า/ผู้ให้เช่า", subExpenseType: "", accountNameEn: "Tax Paid for Customer", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "83", groupingTh: "ค่าตรวจสุขภาพก่อนเข้าทำงาน ของสาขาก่อนเปิดดำเนินงาน", subExpenseType: "Medical / OPD", accountNameEn: "Pre-op Personnel Exps", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "84", groupingTh: "ค่าที่พักในการออกหาสมาชิกของแผนก Canvass ของสาขาก่อนเปิดดำเนินงาน", subExpenseType: "Hotel — Domestic", accountNameEn: "Pre-op Canvassing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "85", groupingTh: "ค่าห้องพัก ของสาขาก่อนเปิดดำเนินงาน", subExpenseType: "Hotel — Domestic", accountNameEn: "Pre-op General Exps", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "86", groupingTh: "ค่าไฟ ของสาขาก่อนเปิดดำเนินงาน", subExpenseType: "", accountNameEn: "Pre. - Op. - Establishment Cost", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "87", groupingTh: "ค่าสัมมนาภายนอก", subExpenseType: "", accountNameEn: "Training Cost - Public", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "88", groupingTh: "ค่าวิทยากร/สัมมนา", subExpenseType: "", accountNameEn: "Training Cost - Consultation", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "89", groupingTh: "ค่าอาหารและเครื่องดื่มสัมมนา", subExpenseType: "Restaurant — Business Meal", accountNameEn: "Training Cost - F&B", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "90", groupingTh: "ค่าเดินทางสัมมนา", subExpenseType: "Taxi / Grab", accountNameEn: "Training Cost - Travelling", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "91", groupingTh: "ค่าที่พักสัมมนา", subExpenseType: "Hotel — Domestic", accountNameEn: "Training Cost - Accommodation", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "92", groupingTh: "ค่าห้องสัมมนา", subExpenseType: "", accountNameEn: "Training Cost - Conference Room", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "93", groupingTh: "ค่าใช้จ่ายสัมมนา-อื่น ๆ", subExpenseType: "", accountNameEn: "Training Cost - Other", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "94", groupingTh: "ค่าหนังสือพิมพ์/สมาชิกข่าวสาร", subExpenseType: "", accountNameEn: "News/Trade Subscription", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "95", groupingTh: "เงินบริจาคให้กับวัด (ได้รับใบอนุโมทนาบัตร)", subExpenseType: "Community / Cultural", accountNameEn: "Charitable Donation(claimed)", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "96", groupingTh: "เงินบริจาคเพื่อการกุศล (ไม่ได้รับเอกสารที่ใช้สิทธิ์ทางภาษีได้)", subExpenseType: "Community / Cultural", accountNameEn: "Charitable Donation(Unclaimed)", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "97", groupingTh: "เงินทุนการศึกษา (ได้รับหนังสือขอบคุณจากทางสถานศึกษา)", subExpenseType: "Community / Cultural", accountNameEn: "Charitable Donation(scholarship)", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "98", groupingTh: "ค่าธรรมเนียมธนาคาร", subExpenseType: "", accountNameEn: "Bank Charges", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "99", groupingTh: "ค่าธรรมเนียมบริการ เช่น ค่าธรรมเนียมโครงการอาสาพัฒนาขอนแก่น", subExpenseType: "", accountNameEn: "Service fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "100", groupingTh: "ค่าตรวจสอบบัญชี", subExpenseType: "", accountNameEn: "Audit Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "101", groupingTh: "ค่าที่ปรึกษา", subExpenseType: "", accountNameEn: "Consultation Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "102", groupingTh: "ค่าใช้จ่ายภาวะฉุกเฉิน เช่น ค่ากระสอบทรายน้ำท่วม , ค่าอุปกรณ์ป้องกันน้ำท่วม", subExpenseType: "", accountNameEn: "Contingency expense", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "103", groupingTh: "ค่าที่พัก สำหรับโครงการพัฒนาบุคลากร", subExpenseType: "Hotel — Domestic", accountNameEn: "People Development project", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "104", groupingTh: "ค่าจ้างบุคคลภายนอก (Outsource) เช่น ค่าพนักงานบริการยกสินค้า", subExpenseType: "", accountNameEn: "Outsourcing Service Fee (Boss/Adecco)", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "105", groupingTh: "ค่าจ้างทนาย", subExpenseType: "", accountNameEn: "Legal Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "106", groupingTh: "ค่าธรรมเนียมใบอนุญาต", subExpenseType: "Government License / Permit", accountNameEn: "Permission Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "107", groupingTh: "ค่าธรรมเนียมตลาดหลักทรัพย์", subExpenseType: "", accountNameEn: "Fees for SET", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "108", groupingTh: "ค่าเบี้ยประกันภัย (ที่ไม่ใช่ประกันชีวิตและอุบัติเหตุ)", subExpenseType: "", accountNameEn: "Insurance-Non-Life", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "109", groupingTh: "ค่าชดเชยความเสียหายลูกค้า", subExpenseType: "Damaged Claims — Customer", accountNameEn: "Damaged Claims fm Customers", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "110", groupingTh: "ค่าขนส่งกระเช้าปีใหม่", subExpenseType: "Courier / Postage", accountNameEn: "Delivery Charge", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "111", groupingTh: "ค่าขนส่ง Transfer สินค้าไปต่างสาขา", subExpenseType: "Courier / Postage", accountNameEn: "Handling Charge", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "112", groupingTh: "ผลต่างของเงินสดที่ขาด/เกิน", subExpenseType: "", accountNameEn: "Cash Difference", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "113", groupingTh: "ค่าใช้จ่ายนับเงินสด", subExpenseType: "", accountNameEn: "Cash Counting Costs", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "114", groupingTh: "ค่าอุปกรณ์ป้องกันร่างกาย", subExpenseType: "", accountNameEn: "Protective Clothing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "115", groupingTh: "ค่าแก๊สสำหรับใช้ในโรงอาหาร", subExpenseType: "", accountNameEn: "Canteen Cost", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "116", groupingTh: "วัสดุสิ้นเปลืองสโตร์", subExpenseType: "", accountNameEn: "Store Supplies", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "117", groupingTh: "ค่าน้ำมันเครื่องปั่นไฟ", subExpenseType: "", accountNameEn: "Store Supplies-Fuel", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "118", groupingTh: "วัสดุสิ้นเปลืองสโตร์-น้ำมัน Forklift", subExpenseType: "", accountNameEn: "Store Suppliers-Fuel Forklift", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "119", groupingTh: "ค่าป้ายสำหรับเตือนเรื่องความปลอดภัย", subExpenseType: "", accountNameEn: "Other General Exp. - Safety", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "120", groupingTh: "ค่าซักเสื้อห้องเย็น", subExpenseType: "", accountNameEn: "Other General Exp-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "121", groupingTh: "ค่าใช้จ่ายไหว้ศาล เช่น ค่าดอกไม้ , ค่าขนมไหว้ศาล", subExpenseType: "Community / Cultural", accountNameEn: "Other non-deductible expenses", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "122", groupingTh: "ค่าห้องพักสำหรับพนักงาน Buffer HO", subExpenseType: "Hotel — Domestic", accountNameEn: "Business Developmnet Operation", active: true, updatedAt: "2026-03-23 10:00:00" },
];

let nextId = 123;

export default function ExpenseTypePanel() {
  const { toast } = useToast();
  const [data, setData] = useState<ExpenseTypeRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ExpenseTypeRow | null>(null);
  const [formGrouping, setFormGrouping] = useState("");
  const [formSubExpenseType, setFormSubExpenseType] = useState("");
  const [formAccount, setFormAccount] = useState("");
  const [formActive, setFormActive] = useState(true);

  // CSV Import modal
  const [importOpen, setImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ groupingTh: string; subExpenseType: string; accountNameEn: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.groupingTh.toLowerCase().includes(q) || r.subExpenseType.toLowerCase().includes(q) || r.accountNameEn.toLowerCase().includes(q)
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
    setFormGrouping("");
    setFormSubExpenseType("");
    setFormAccount("");
    setFormActive(true);
    setModalOpen(true);
  };

  const openEdit = (row: ExpenseTypeRow) => {
    setEditingRow(row);
    setFormGrouping(row.groupingTh);
    setFormSubExpenseType(row.subExpenseType);
    setFormAccount(row.accountNameEn);
    setFormActive(row.active);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formGrouping.trim() || !formAccount.trim()) {
      toast({ title: "Validation Error", description: "Expense Type and Account Name are required.", variant: "destructive" });
      return;
    }
    const ts = now();
    if (editingRow) {
      setData((prev) =>
        prev.map((r) =>
          r.id === editingRow.id
            ? { ...r, groupingTh: formGrouping.trim(), subExpenseType: formSubExpenseType.trim(), accountNameEn: formAccount.trim(), active: formActive, updatedAt: ts }
            : r
        )
      );
      toast({ title: "Updated", description: "Expense type updated successfully." });
    } else {
      const newRow: ExpenseTypeRow = {
        id: String(nextId++),
        groupingTh: formGrouping.trim(),
        subExpenseType: formSubExpenseType.trim(),
        accountNameEn: formAccount.trim(),
        active: formActive,
        updatedAt: ts,
      };
      setData((prev) => [...prev, newRow]);
      toast({ title: "Created", description: "Expense type added successfully." });
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Deleted", description: "Expense type removed." });
  };

  const handleToggle = (id: string, checked: boolean) => {
    setData((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: checked, updatedAt: now() } : r))
    );
  };

  // CSV
  const downloadTemplate = () => {
    const csv = "expense_type,sub_expense_type,account_name_en\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expense_type_template.csv";
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
        const [groupingTh = "", subExpenseType = "", accountNameEn = ""] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        return { groupingTh, subExpenseType, accountNameEn };
      }).filter((r) => r.groupingTh && r.accountNameEn);
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    const ts = now();
    const newRows: ExpenseTypeRow[] = csvPreview.map((r) => ({
      id: String(nextId++),
      groupingTh: r.groupingTh,
      subExpenseType: r.subExpenseType,
      accountNameEn: r.accountNameEn,
      active: true,
      updatedAt: ts,
    }));
    setData((prev) => [...prev, ...newRows]);
    toast({ title: "Imported", description: `${newRows.length} expense types imported.` });
    setCsvPreview([]);
    setImportOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Expense Type</h2>
          <p className="text-sm text-muted-foreground">
            Manage expense type groupings and their mapped GL account names.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setCsvPreview([]); setImportOpen(true); }}>
            <Upload className="h-4 w-4 mr-2" />Import CSV
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />Add Expense Type
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
            placeholder="Search expense type, sub type, or account name..."
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
                <TableHead>Sub Expense Type</TableHead>
                <TableHead>Account Name (EN)</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No expense types found
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.groupingTh}</TableCell>
                  <TableCell className="text-sm">{row.subExpenseType || "—"}</TableCell>
                  <TableCell>{row.accountNameEn}</TableCell>
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
            <DialogTitle>{editingRow ? "Edit Expense Type" : "Add Expense Type"}</DialogTitle>
            <DialogDescription>
              {editingRow ? "Update the expense type details below." : "Fill in the details to create a new expense type."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="grouping">Expense Type <span className="text-destructive">*</span></Label>
              <Input id="grouping" value={formGrouping} onChange={(e) => setFormGrouping(e.target.value)} placeholder="e.g. ค่าเดินทาง, ค่าที่พัก" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subExpenseType">Sub Expense Type</Label>
              <Input id="subExpenseType" value={formSubExpenseType} onChange={(e) => setFormSubExpenseType(e.target.value)} placeholder="e.g. Taxi / Grab, Hotel — Domestic" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name (EN) <span className="text-destructive">*</span></Label>
              <Input id="accountName" value={formAccount} onChange={(e) => setFormAccount(e.target.value)} placeholder="e.g. Local Travelling" />
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
            <DialogTitle>Import Expense Types from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file to bulk-import expense types.</DialogDescription>
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
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
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
                        <TableHead>Sub Expense Type</TableHead>
                        <TableHead>Account Name (EN)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{r.groupingTh}</TableCell>
                          <TableCell className="text-sm">{r.subExpenseType || "—"}</TableCell>
                          <TableCell className="text-sm">{r.accountNameEn}</TableCell>
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
