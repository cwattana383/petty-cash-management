export interface DirectoryEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  email: string;
  phone: string;
}

export const EMPLOYEE_DIRECTORY: DirectoryEmployee[] = [
  { employeeId: "EMP-001001", firstName: "Somchai", lastName: "Jaidee", department: "Finance", position: "Finance Manager", email: "somchai.jaidee@cpaxtra.co.th", phone: "081-234-5671" },
  { employeeId: "EMP-001002", firstName: "Prin", lastName: "Sawatdee", department: "Procurement", position: "Procurement Officer", email: "prin.sawatdee@cpaxtra.co.th", phone: "081-234-5672" },
  { employeeId: "EMP-001003", firstName: "Nattapong", lastName: "Srisuk", department: "IT", position: "System Analyst", email: "nattapong.srisuk@cpaxtra.co.th", phone: "081-234-5673" },
  { employeeId: "EMP-001004", firstName: "Kanokwan", lastName: "Chaiyaporn", department: "Human Resources", position: "HR Specialist", email: "kanokwan.chaiyaporn@cpaxtra.co.th", phone: "081-234-5674" },
  { employeeId: "EMP-001005", firstName: "Anucha", lastName: "Thongdee", department: "Logistics", position: "Fleet Supervisor", email: "anucha.thongdee@cpaxtra.co.th", phone: "081-234-5675" },
  { employeeId: "EMP-001006", firstName: "Siriporn", lastName: "Wongchai", department: "Accounting", position: "Senior Accountant", email: "siriporn.wongchai@cpaxtra.co.th", phone: "081-234-5676" },
  { employeeId: "EMP-001007", firstName: "Thanakorn", lastName: "Pimchai", department: "Sales", position: "Sales Executive", email: "thanakorn.pimchai@cpaxtra.co.th", phone: "081-234-5677" },
  { employeeId: "EMP-001008", firstName: "Pornthip", lastName: "Rattanakul", department: "Marketing", position: "Marketing Manager", email: "pornthip.rattanakul@cpaxtra.co.th", phone: "081-234-5678" },
  { employeeId: "EMP-001009", firstName: "Wichai", lastName: "Boonmee", department: "Operations", position: "Store Manager", email: "wichai.boonmee@cpaxtra.co.th", phone: "081-234-5679" },
  { employeeId: "EMP-001010", firstName: "Suphansa", lastName: "Kittisak", department: "Finance", position: "Financial Analyst", email: "suphansa.kittisak@cpaxtra.co.th", phone: "081-234-5680" },
  { employeeId: "EMP-001011", firstName: "Chalermchai", lastName: "Nopparat", department: "Legal", position: "Legal Counsel", email: "chalermchai.nopparat@cpaxtra.co.th", phone: "081-234-5681" },
  { employeeId: "EMP-001012", firstName: "Ratchanok", lastName: "Phromma", department: "Customer Service", position: "CS Team Lead", email: "ratchanok.phromma@cpaxtra.co.th", phone: "081-234-5682" },
  { employeeId: "EMP-001013", firstName: "Teerapat", lastName: "Suwannarat", department: "IT", position: "Network Engineer", email: "teerapat.suwannarat@cpaxtra.co.th", phone: "081-234-5683" },
  { employeeId: "EMP-001014", firstName: "Malee", lastName: "Intharat", department: "Procurement", position: "Category Buyer", email: "malee.intharat@cpaxtra.co.th", phone: "081-234-5684" },
  { employeeId: "EMP-001015", firstName: "Kittipong", lastName: "Charoensri", department: "Logistics", position: "Transport Planner", email: "kittipong.charoensri@cpaxtra.co.th", phone: "081-234-5685" },
];

export const employeeFullName = (e: DirectoryEmployee) => `${e.firstName} ${e.lastName}`;
