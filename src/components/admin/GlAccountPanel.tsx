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
  "ค่าขนส่ง ส่งของให้ลูกค้า (Last Mile)",
  "จ่าย ภาษีหัก ณ ที่จ่าย (1%) ให้แก่หน่วยงานราชการ",
  "ค่ายา สำหรับให้พนักงานใช้",
  "ค่าน้ำประปา",
  "ค่าซื้อน้ำดิบ",
  "ค่าเก็บขยะ",
  "ค่าดูดไขมันและสูบสิ่งปฏิกูล",
  "ค่าทะลวงท่อระบายน้ำอุดตัน",
  "ค่าตัดหญ้า",
  "ค่าจัดสวน, ค่าต้นไม้, ค่าดิน สำหรับตกแต่งสวน",
  "ค่าไฟ",
  "ค่าทำความสะอาด",
  "ค่าตู้แดง (ตำรวจ)",
  "ค่าภาษีที่ดิน และ สิ่งปลูกสร้าง",
  "ค่าโฆษณาทางวิทยุ",
  "ค่าภาษีป้าย",
  "ค่าโฆษณา ป้ายติดรถสองแถว",
  "ค่าของรางวัลวันครบรอบแม็คโคร",
  "ค่าที่พักในการออกหาสมาชิกของแผนก Canvass",
  "ค่าขนส่งสินค้าตัวอย่างเพื่อเทสสินค้า",
  "ค่าป้ายไวนิล เพื่อประชาสัมพันธ์",
  "ค่าอาหารและเครื่องดื่ม Visit ลูกค้า Horeca",
  "ค่าของรางวัล",
  "ค่าป้ายตกแต่ง สำหรับโปรโมชั่นสาขา",
  "ค่าขนส่งป้าย งานโชห่วย",
  "ค่าทำป้ายไวนิล สำหรับติดตั้งกับรถแห่เพื่อประชาสัมพันธ์",
  "ค่าใช้จ่ายคอมพิวเตอร์/ซ่อม-อะไหล่,ชิ้นส่วนประกอบ",
  "ค่าใช้จ่ายคอมพิวเตอร์-วัสดุสิ้นเปลือง",
  "ค่าซ่อมแซม-บำรุงรักษาอาคาร",
  "ค่าซ่อมแซม-เครื่องจักรพร้อมการติดตั้ง",
  "ค่าซ่อมแซม-เครื่องตกแต่งสำนักงาน",
  "ค่าซ่อมแซม-อุปกรณ์ในสำนักงาน",
  "ค่าซ่อมแซม-อุปกรณ์ในร้านค้า",
  "ค่าซ่อมแซม-อื่น ๆ",
  "ค่าตรวจสุขภาพก่อนเริ่มงาน",
  "สวัสดิการ PC ดีเด่น",
  "ค่าพวงหรีด",
  "ค่าใช้จ่ายจ้างพนักงาน Part Time",
  "ค่าตรวจสุขภาพ พนักงานฝึกงาน",
  "ค่ากระเช้าดอกไม้ให้ลูกค้า",
  "ค่าอาหาร เครื่องดื่มพนักงานนับสต็อค",
  "ค่าเดินทาง (Local)",
  "ค่าเดินทาง (Oversea)",
  "ค่าน้ำมันสำหรับยานพาหนะ",
  "ค่าใช้จ่ายซ่อมบำรุงยานพาหนะ",
  "ค่าต่อภาษีรถยนต์",
  "ค่าทางด่วน",
  "ค่าเช่าอุปกรณ์ร้านค้า",
  "ค่าเช่าเครื่องใช้อื่น ๆ",
  "ค่าเช่า Forklift",
  "ค่าเช่า Container",
  "ค่าเช่าเต็นท์",
  "ค่าเช่าอื่น ๆ",
  "ค่าโทรศัพท์/โทรสาร",
  "ค่าส่งไปรษณี",
  "ค่าวัสดุสำนักงานและสิ่งพิมพ์",
  "วัสดุสิ้นเปลืองสำนักงาน-อื่น ๆ",
  "เงินเพิ่ม/เบี้ยปรับภาษี",
  "ภาษีจ่ายแทนลูกค้า/ผู้ให้เช่า",
  "ค่าสัมมนาภายนอก",
  "ค่าอาหารและเครื่องดื่มสัมมนา",
  "ค่าเดินทางสัมมนา",
  "ค่าที่พักสัมมนา",
  "ค่าห้องสัมมนา",
  "ค่าธรรมเนียมธนาคาร",
  "ค่าตรวจสอบบัญชี",
  "ค่าที่ปรึกษา",
  "ค่าจ้างทนาย",
  "ค่าธรรมเนียมใบอนุญาต",
  "ค่าธรรมเนียมตลาดหลักทรัพย์",
  "วัสดุสิ้นเปลืองสโตร์",
  "วัสดุสิ้นเปลืองสโตร์-น้ำมัน Forklift",
  "ค่าซักเสื้อห้องเย็น",
  "ค่าใช้จ่ายไหว้ศาล เช่น ค่าดอกไม้ , ค่าขนมไหว้ศาล",
  "ค่าห้องพักสำหรับพนักงาน Buffer HO",
];

const initialData: GlAccountRow[] = [
  { id: "1", expenseType: "ค่าขนส่ง ส่งของให้ลูกค้า (Last Mile)", accountCode: "6190060001", accountName: "Other Income - Delivery Cost", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "2", expenseType: "จ่าย ภาษีหัก ณ ที่จ่าย (1%) ให้แก่หน่วยงานราชการ", accountCode: "2135100004", accountName: "Tax Withheld - Sales", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "3", expenseType: "ค่ายา สำหรับให้พนักงานใช้", accountCode: "6110040001", accountName: "Personnel Cost-Sick Pay & physical checkup", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "4", expenseType: "ค่าน้ำประปา", accountCode: "6115010101", accountName: "Establish.Cost-Water", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "5", expenseType: "ค่าเก็บขยะ", accountCode: "6115900001", accountName: "Establish.Cost-Sewage Charge", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "6", expenseType: "ค่าตัดหญ้า", accountCode: "6115900002", accountName: "Establishment Cost-Garden Service", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "7", expenseType: "ค่าไฟ", accountCode: "6115020201", accountName: "Establish.Cost-Electricity", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "8", expenseType: "ค่าทำความสะอาด", accountCode: "6115030001", accountName: "Establish.Cost-Cleaning", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "9", expenseType: "ค่าตู้แดง (ตำรวจ)", accountCode: "6115030002", accountName: "Establish.Cost-Security", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "10", expenseType: "ค่าภาษีที่ดิน และ สิ่งปลูกสร้าง", accountCode: "6115040001", accountName: "Establishment Cost - Land and Building Tax", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "11", expenseType: "ค่าลงโฆษณาในหนังสือพิมพ์ เชิญประชุมสามัญผู้ถือหุ้น", accountCode: "6125020001", accountName: "Advertisement-Newspaper", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "12", expenseType: "ค่าโฆษณาทางวิทยุ", accountCode: "6125020004", accountName: "Advertisement-Public Radio", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "13", expenseType: "ค่าภาษีป้าย", accountCode: "6125020006", accountName: "Advertisement-Signboard Tax", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "14", expenseType: "ค่าโฆษณา ป้ายติดรถสองแถว", accountCode: "6125020090", accountName: "Advertisement-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "15", expenseType: "ค่าของรางวัลวันครบรอบแม็คโคร", accountCode: "6125040001", accountName: "Promotion-Grand Opening & Anniversary", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "16", expenseType: "ค่าที่พักในการออกหาสมาชิกของแผนก Canvass", accountCode: "6125040002", accountName: "Promotion-Canvassing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "17", expenseType: "ค่าขนส่งสินค้าตัวอย่างเพื่อเทสสินค้า", accountCode: "6125040004", accountName: "Promotion-Fighting Pro./Sample Product", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "18", expenseType: "ค่าป้ายไวนิล เพื่อประชาสัมพันธ์", accountCode: "6125030090", accountName: "PR & CSR - Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "19", expenseType: "ค่าเดินทางพาลูกค้าไปเข้าร่วมแข่งขัน Horeca challenge", accountCode: "6125900004", accountName: "Other Sale Promot.-HORECA/MRA Event", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "20", expenseType: "ค่าอาหารและเครื่องดื่ม Visit ลูกค้า Horeca", accountCode: "6125900006", accountName: "Other Sale Promot.-HORECA customer", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "21", expenseType: "ค่าของรางวัล", accountCode: "6125900007", accountName: "Other Sales Promotion - Customer Develop", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "22", expenseType: "ค่าป้ายตกแต่ง สำหรับโปรโมชั่นสาขา", accountCode: "6125900008", accountName: "Other Sales Promotion - Store Decoration", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "23", expenseType: "ค่าขนส่งป้าย งานโชห่วย", accountCode: "6125900009", accountName: "Other Sales Promotion - MRA", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "24", expenseType: "ค่าทำป้ายไวนิล สำหรับติดตั้งกับรถแห่เพื่อประชาสัมพันธ์", accountCode: "6125900090", accountName: "Other Sale Promot.-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "25", expenseType: "ค่าใช้จ่ายคอมพิวเตอร์/ซ่อม-อะไหล่,ชิ้นส่วนประกอบ", accountCode: "6130000007", accountName: "Computer Exp. - Repair Spareparts", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "26", expenseType: "ค่าใช้จ่ายคอมพิวเตอร์-วัสดุสิ้นเปลือง", accountCode: "6130000008", accountName: "Computer Exp. - Supplies", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "27", expenseType: "ค่าซ่อมแซม-บำรุงรักษาอาคาร", accountCode: "6120010001", accountName: "Repair Building", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "28", expenseType: "ค่าซ่อมแซม-เครื่องจักรพร้อมการติดตั้ง", accountCode: "6120010002", accountName: "Repair Machine & Installation", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "29", expenseType: "ค่าซ่อมแซม-เครื่องตกแต่งสำนักงาน", accountCode: "6120010003", accountName: "Repair Office Fur & Fixture", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "30", expenseType: "ค่าซ่อมแซม-อุปกรณ์ในสำนักงาน", accountCode: "6120010004", accountName: "Repair Office Epuipment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "31", expenseType: "ค่าซ่อมแซม-อุปกรณ์ในร้านค้า", accountCode: "6120010005", accountName: "Repair Plant Equipment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "32", expenseType: "ค่าซ่อมแซม-อื่น ๆ", accountCode: "6120010090", accountName: "Repair Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "33", expenseType: "ค่าตรวจสุขภาพก่อนเริ่มงาน", accountCode: "6190010001", accountName: "Other Personnel Cost-Recruitment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "34", expenseType: "สวัสดิการ PC ดีเด่น", accountCode: "6190010003", accountName: "Other Personnel Cost-Incentive Scheme", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "35", expenseType: "ค่าพวงหรีด", accountCode: "6190010090", accountName: "Other Personnel Cost-Other", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "36", expenseType: "ค่าใช้จ่ายจ้างพนักงาน Part Time", accountCode: "6190010004", accountName: "Oth. Pers. Cost - Part Time", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "37", expenseType: "ค่าตรวจสุขภาพ พนักงานฝึกงาน", accountCode: "6190010006", accountName: "Oth. Pers. Cost - Trainee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "38", expenseType: "ค่ากระเช้าดอกไม้ให้ลูกค้า", accountCode: "6190180001", accountName: "Entertainment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "39", expenseType: "ค่าอาหาร เครื่องดื่มพนักงานนับสต็อค", accountCode: "6190180002", accountName: "Staff Meeting and Refreshment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "40", expenseType: "ค่าเดินทาง (Local)", accountCode: "6190130001", accountName: "Local Travelling", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "41", expenseType: "ค่าเดินทาง (Oversea)", accountCode: "6190130002", accountName: "Oversea Travel", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "42", expenseType: "ค่าน้ำมันสำหรับยานพาหนะ", accountCode: "6190160001", accountName: "Vehicle Running Cost-Fuel", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "43", expenseType: "ค่าใช้จ่ายซ่อมบำรุงยานพาหนะ", accountCode: "6190160002", accountName: "Vehicle Running Cost-Maint", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "44", expenseType: "ค่าต่อภาษีรถยนต์", accountCode: "6190160003", accountName: "Vehicle Running Cost-Registration Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "45", expenseType: "ค่าทางด่วน", accountCode: "6190160090", accountName: "Vehicle Running Cost-Other", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "46", expenseType: "ค่าเช่าอุปกรณ์ร้านค้า", accountCode: "6190200001", accountName: "Hire of Plant Equipment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "47", expenseType: "ค่าเช่าเครื่องใช้อื่น ๆ", accountCode: "6190200002", accountName: "Hire of Other equipment", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "48", expenseType: "ค่าเช่า Forklift", accountCode: "6190200005", accountName: "Hire of Forklift", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "49", expenseType: "ค่าเช่า Container", accountCode: "6190200006", accountName: "Hire of Container", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "50", expenseType: "ค่าเช่าเต็นท์", accountCode: "6190200007", accountName: "Hire of Tent", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "51", expenseType: "ค่าเช่าอื่น ๆ", accountCode: "6190200090", accountName: "Hire of Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "52", expenseType: "ค่าโทรศัพท์/โทรสาร", accountCode: "6190120001", accountName: "Telephone/Telex/Fax", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "53", expenseType: "ค่าส่งไปรษณี", accountCode: "6190110001", accountName: "Postages & Stamp Duties", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "54", expenseType: "ค่าวัสดุสำนักงานและสิ่งพิมพ์", accountCode: "6190110002", accountName: "Stationery & Printing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "55", expenseType: "วัสดุสิ้นเปลืองสำนักงาน-อื่น ๆ", accountCode: "6190110090", accountName: "All Other Office Supplies", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "56", expenseType: "เงินเพิ่ม/เบี้ยปรับภาษี", accountCode: "6190170003", accountName: "Tax Penalty", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "57", expenseType: "ภาษีจ่ายแทนลูกค้า/ผู้ให้เช่า", accountCode: "6190170004", accountName: "Tax Paid for Customer", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "58", expenseType: "ค่าตรวจสุขภาพก่อนเข้าทำงาน ของสาขาก่อนเปิดดำเนินงาน", accountCode: "6190040001", accountName: "Pre-op Personnel Exps", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "59", expenseType: "ค่าที่พักในการออกหาสมาชิกของแผนก Canvass ของสาขาก่อนเปิดดำเนินงาน", accountCode: "6190040002", accountName: "Pre-op Canvassing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "60", expenseType: "ค่าห้องพัก ของสาขาก่อนเปิดดำเนินงาน", accountCode: "6190040005", accountName: "Pre-op General Exps", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "61", expenseType: "ค่าไฟ ของสาขาก่อนเปิดดำเนินงาน", accountCode: "6190040006", accountName: "Pre. - Op. - Establishment Cost", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "62", expenseType: "ค่าสัมมนาภายนอก", accountCode: "6190100001", accountName: "Training Cost - Public", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "63", expenseType: "ค่าวิทยากร/สัมมนา", accountCode: "6190100002", accountName: "Training Cost - Consultation", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "64", expenseType: "ค่าอาหารและเครื่องดื่มสัมมนา", accountCode: "6190100003", accountName: "Training Cost - F&B", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "65", expenseType: "ค่าเดินทางสัมมนา", accountCode: "6190100004", accountName: "Training Cost - Travelling", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "66", expenseType: "ค่าที่พักสัมมนา", accountCode: "6190100005", accountName: "Training Cost - Accommodation", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "67", expenseType: "ค่าห้องสัมมนา", accountCode: "6190100006", accountName: "Training Cost - Conference Room", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "68", expenseType: "ค่าใช้จ่ายสัมมนา-อื่น ๆ", accountCode: "6190100090", accountName: "Training Cost - Other", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "69", expenseType: "ค่าหนังสือพิมพ์/สมาชิกข่าวสาร", accountCode: "6190900002", accountName: "News/Trade Subscription", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "70", expenseType: "เงินบริจาคให้กับวัด (ได้รับใบอนุโมทนาบัตร)", accountCode: "6190190001", accountName: "Charitable Donation(claimed)", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "71", expenseType: "เงินบริจาคเพื่อการกุศล (ไม่ได้รับเอกสารที่ใช้สิทธิ์ทางภาษีได้)", accountCode: "6190190001", accountName: "Charitable Donation(Unclaimed)", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "72", expenseType: "เงินทุนการศึกษา (ได้รับหนังสือขอบคุณจากทางสถานศึกษา)", accountCode: "6190190002", accountName: "Charitable Donation(scholarship)", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "73", expenseType: "ค่าธรรมเนียมธนาคาร", accountCode: "6190070001", accountName: "Bank Charges", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "74", expenseType: "ค่าธรรมเนียมบริการ เช่น ค่าธรรมเนียมโครงการอาสาพัฒนาขอนแก่น", accountCode: "6190900003", accountName: "Service fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "75", expenseType: "ค่าตรวจสอบบัญชี", accountCode: "6190030001", accountName: "Audit Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "76", expenseType: "ค่าที่ปรึกษา", accountCode: "6190030002", accountName: "Consultation Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "77", expenseType: "ค่าใช้จ่ายภาวะฉุกเฉิน เช่น ค่ากระสอบทรายน้ำท่วม , ค่าอุปกรณ์ป้องกันน้ำท่วม", accountCode: "6190900001", accountName: "Contingency expense", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "78", expenseType: "ค่าที่พัก สำหรับโครงการพัฒนาบุคลากร", accountCode: "6190900004", accountName: "People Development project", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "79", expenseType: "ค่าจ้างบุคคลภายนอก (Outsource) เช่น ค่าพนักงานบริการยกสินค้า", accountCode: "6190020002", accountName: "Outsourcing Service Fee (Boss/Adecco)", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "80", expenseType: "ค่าจ้างทนาย", accountCode: "6190030003", accountName: "Legal Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "81", expenseType: "ค่าธรรมเนียมใบอนุญาต", accountCode: "6190900005", accountName: "Permission Fee", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "82", expenseType: "ค่าธรรมเนียมตลาดหลักทรัพย์", accountCode: "6190030004", accountName: "Fees for SET", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "83", expenseType: "ค่าเบี้ยประกันภัย (ที่ไม่ใช่ประกันชีวิตและอุบัติเหตุ)", accountCode: "6190090001", accountName: "Insurance-Non-Life", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "84", expenseType: "ค่าชดเชยความเสียหายลูกค้า", accountCode: "6190900006", accountName: "Damaged Claims fm Customers", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "85", expenseType: "ค่าขนส่งกระเช้าปีใหม่", accountCode: "6190060002", accountName: "Delivery Charge", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "86", expenseType: "ค่าขนส่ง Transfer สินค้าไปต่างสาขา", accountCode: "6190060004", accountName: "Handling Charge", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "87", expenseType: "ผลต่างของเงินสดที่ขาด/เกิน", accountCode: "6190900007", accountName: "Cash Difference", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "88", expenseType: "ค่าใช้จ่ายนับเงินสด", accountCode: "6190900008", accountName: "Cash Counting Costs", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "89", expenseType: "ค่าอุปกรณ์ป้องกันร่างกาย", accountCode: "6190900009", accountName: "Protective Clothing", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "90", expenseType: "ค่าแก๊สสำหรับใช้ในโรงอาหาร", accountCode: "6190900010", accountName: "Canteen Cost", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "91", expenseType: "วัสดุสิ้นเปลืองสโตร์", accountCode: "6190080001", accountName: "Store Supplies", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "92", expenseType: "ค่าน้ำมันเครื่องปั่นไฟ", accountCode: "6190080002", accountName: "Store Supplies-Fuel", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "93", expenseType: "วัสดุสิ้นเปลืองสโตร์-น้ำมัน Forklift", accountCode: "6190080004", accountName: "Store Suppliers-Fuel Forklift", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "94", expenseType: "ค่าป้ายสำหรับเตือนเรื่องความปลอดภัย", accountCode: "6190900013", accountName: "Other General Exp. - Safety", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "95", expenseType: "ค่าซักเสื้อห้องเย็น", accountCode: "6190900090", accountName: "Other General Exp-Others", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "96", expenseType: "ค่าใช้จ่ายไหว้ศาล เช่น ค่าดอกไม้ , ค่าขนมไหว้ศาล", accountCode: "6190900090", accountName: "Other non-deductible expenses", active: true, updatedAt: "2026-03-23 10:00:00" },
  { id: "97", expenseType: "ค่าห้องพักสำหรับพนักงาน Buffer HO", accountCode: "6190050002", accountName: "Business Developmnet Operation", active: true, updatedAt: "2026-03-23 10:00:00" },
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
