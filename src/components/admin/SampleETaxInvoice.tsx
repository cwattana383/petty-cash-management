/* Mock e-Tax invoice page used until real PDFs are available. Document content is Thai by design. */
interface Props {
  invoiceNo?: string;
  saleDate?: string; // dd/mm/yyyy BE
  total?: number;
}

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SampleETaxInvoice({ invoiceNo = "116521893610010017", saleDate = "01/10/2569", total = 500 }: Props) {
  const product = Math.round((total / 1.07) * 100) / 100;
  const vat = Math.round((total - product) * 100) / 100;
  const words = total === 500 ? "(ห้าร้อยบาทถ้วน)" : "-";

  return (
    <div className="h-full w-full bg-white p-10 text-[13px] leading-relaxed text-black" style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="font-bold">บริษัท เจเจ ปิโตรเลียม จำกัด</p>
          <p>เลขที่ประจำตัวผู้เสียภาษี 0965554000128</p>
          <p>สำนักงานใหญ่</p>
          <p>ที่อยู่ 777 หมู่ที่ 7 ตำบลท่าตูม อำเภอท่าตูม จังหวัดสุรินทร์ 32120</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">ใบเสร็จรับเงิน/ใบกำกับภาษี</p>
          <p className="text-lg font-bold">RECEIPT/TAX INVOICE</p>
          <p className="mt-1">POS#1 - P3</p>
          <p>RD # .</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="space-y-0.5">
          <p><span className="font-bold">ชื่อลูกค้า</span>&nbsp;&nbsp;CP AXTRA PUBLIC COMPANY LIMITED</p>
          <p>เลขประจำตัวผู้เสียภาษี&nbsp;&nbsp;0107567000414 สำนักงานใหญ่</p>
          <p>ที่อยู่ :&nbsp;&nbsp;1468 Rd.PHATTHANAKAN PHATTHANAKAN SUAN LUANG BANGKOK 10250</p>
          <p className="flex items-center gap-2">
            ทะเบียนรถ :<span className="inline-block h-4 w-24 rounded-sm bg-neutral-200" />
            <span className="ml-4">เลขไมล์ :&nbsp;&nbsp;0 กิโลเมตร</span>
          </p>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 self-start">
          <span className="text-right">เลขที่ใบกำกับภาษี</span><span>{invoiceNo}</span>
          <span className="text-right">วันที่ขาย</span><span>{saleDate} 19:53:39</span>
          <span className="text-right">วันที่ใบกำกับภาษี</span><span>{saleDate} 19:56:53</span>
        </div>
      </div>

      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="border-y border-neutral-400">
            <th className="py-1 text-center font-normal">ลำดับ<br />No.</th>
            <th className="py-1 text-left font-normal">รายการ<br />Description</th>
            <th className="py-1 text-center font-normal">ราคา/หน่วย<br />Unit Price</th>
            <th className="py-1 text-center font-normal">ปริมาณ<br />Quantity</th>
            <th className="py-1 text-center font-normal">จำนวนเงิน(บาท)<br />Amount(Baht)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1 text-center">1</td>
            <td className="py-1">GASOHOL 95</td>
            <td className="py-1 text-right pr-6">40.47</td>
            <td className="py-1 text-right pr-6">12.350 L</td>
            <td className="py-1 text-right pr-6">{fmt(total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-8 grid grid-cols-2 gap-6">
        <div>
          <p>รวมเป็นเงินตัวอักษร&nbsp;&nbsp;{words}</p>
          <p>Fleet Card ttb\600000******5004</p>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-0.5">
          <span>มูลค่าสินค้า</span><span className="text-right">{fmt(product)}</span>
          <span>ภาษีมูลค่าเพิ่ม (Total VAT 7.00 %)</span><span className="text-right">{fmt(vat)}</span>
          <span>รวมเป็นเงิน</span><span className="text-right">{fmt(total)}</span>
        </div>
      </div>

      <div className="mt-8 border-t border-neutral-400 pt-2 font-bold">
        <p>เอกสารนี้ได้จัดทำและส่งข้อมูลให้แก่กรมสรรพากร</p>
        <p>ด้วยวิธีการทางอิเล็กทรอนิกส์</p>
      </div>
    </div>
  );
}
