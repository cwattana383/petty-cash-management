

# Expense Claim Management System

ระบบเบิกค่าใช้จ่ายพนักงาน พร้อม AI Document Extraction, Approval Workflow, และ Bank Reconciliation

## Design Reference
- UI style ตามภาพอ้างอิง: Sidebar navigation สีขาว-แดง, clean layout, card-based components
- สีหลัก: แดง (primary), ขาว (background), เทาอ่อน (secondary)
- Responsive design รองรับมือถือ

---

## Phase 1: Foundation & Authentication

### 1.1 Layout & Navigation
- Sidebar navigation ตามภาพ: Dashboard, Upload Document, Documents, Report, Reconcile, Admin
- Top bar แสดงชื่อผู้ใช้ + avatar
- Responsive sidebar (collapse บนมือถือ)

### 1.2 Authentication & User Profile
- Login page พร้อม email/password (Supabase Auth)
- Profile page: ชื่อ, รหัสพนักงาน, สาขา, หน่วยงาน, Cost Center, ตำแหน่ง, Role, Line Manager
- เปลี่ยนรหัสผ่าน, ตั้งค่า Notification

### 1.3 Database Schema (Supabase)
- ตาราง Users, Roles, Branches, Departments, Cost Centers, Projects
- Role-based access: Employee, Manager, Accounting, Admin
- RLS policies ตาม Role และ Branch/Department

---

## Phase 2: Expense Claim Creation

### 2.1 Upload Document (AI Extraction)
- Drag & drop upload รองรับ PDF/JPG/PNG หลายไฟล์ (ตามภาพอ้างอิง)
- Preview เอกสาร
- AI extraction ผ่าน Lovable AI (Gemini) เพื่อดึงข้อมูล: Vendor, วันที่, เลขที่ใบกำกับ, VAT, ยอดเงิน, สกุลเงิน, หมวดค่าใช้จ่าย
- แสดง Extraction Confidence ต่อฟิลด์
- สร้าง Draft อัตโนมัติจากข้อมูลที่ดึงได้

### 2.2 Manual Claim Creation
- Form Header: Company, Branch, Department, Cost Center, Purpose, Payment Method, Currency
- Form Lines: Expense Type, Amount, VAT, Tax Invoice No., Date, Project, Attachments, Memo
- เพิ่ม/ลบ Lines ได้

### 2.3 Review & Validation
- ตรวจสอบยอดรวม = ผลรวม Lines
- Validate VAT + เลขที่ใบกำกับ
- ตรวจวันที่ตาม policy
- ปุ่ม: Save Draft, Submit for Approval, Delete Draft

---

## Phase 3: Claims Management & Approval

### 3.1 My Claims (Employee)
- รายการเบิกทั้งหมด พร้อมสถานะ: Draft, Pending, Approved, Rejected, Need Info, Paid, Reconciled
- Filter: วันที่, สาขา, หน่วยงาน, สถานะ, ประเภท, วิธีชำระเงิน
- รายละเอียด + Timeline การอนุมัติ + Comments

### 3.2 Approval Inbox (Manager)
- Worklist รายการรออนุมัติ แยกตามทีม
- ดูรายละเอียด: เอกสารแนบ, Header/Lines, ประวัติอนุมัติ
- ปุ่ม: Approve, Reject (ใส่เหตุผล), Request More Info, Delegate
- Multi-level approval ตามวงเงิน

### 3.3 Accounting Review
- Queue ตรวจสอบรายการ: Pending Review, Exception, Ready for ERP
- แก้ไข Header/Lines, เปลี่ยนหมวดบัญชี/Account Code/Tax Code
- Mark as Ready to Interface / Ready to Pay

---

## Phase 4: Reconciliation & Reporting

### 4.1 Bank Reconciliation
- Import CSV รายการธนาคาร/บัตรบริษัท
- แสดงรายการธุรกรรม
- Auto match (วันที่ + จำนวนเงิน + ผู้ถือบัตร + ร้านค้า)
- Manual match + Split match
- สถานะ: Unmatched, Matched, Partially Matched, Exception

### 4.2 Dashboard & Reports
- Dashboard สรุป: ยอดเบิกตามเดือน/หน่วยงาน/ประเภท/สถานะ (Charts)
- รายงาน: Expense by Dept, Pending Aging, Rejected Reasons, Reconciliation Summary
- Export: Excel/CSV
- กำหนดสิทธิ์ตาม Role

---

## Phase 5: Admin & Integration

### 5.1 Admin Settings
- จัดการ Role & Permission (per menu/action)
- Org Structure: Company, Branch, Department, Cost Center, Project
- ผูกพนักงาน + Line Manager

### 5.2 Approval Workflow Builder
- ตั้งค่า Workflow ตามวงเงิน, ประเภท, สาขา, วิธีจ่าย
- กำหนดวงเงินอนุมัติต่อระดับ
- Multi-step approval

### 5.3 Email Notifications
- Template + trigger: Submit, Approve, Reject, Need Info, Reminder

### 5.4 ERP Integration Settings
- ตั้งค่า Endpoint, Auth, Field mapping
- ส่ง Claim ที่อนุมัติไป ERP
- สถานะ Interface: Not Sent, Sent, Failed
- Log + Retry queue

### 5.5 Audit Trail
- บันทึกทุกการแก้ไข/อนุมัติ/Reconcile พร้อม before/after data

---

## Technical Stack
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — Database, Auth, Storage, Edge Functions
- **AI OCR**: Lovable AI Gateway (Gemini) สำหรับ document extraction
- **File Storage**: Supabase Storage สำหรับเอกสารแนบ
- **Charts**: Recharts (ติดตั้งแล้ว)

