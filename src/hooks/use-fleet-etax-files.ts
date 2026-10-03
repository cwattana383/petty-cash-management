import { useCallback, useState } from "react";

export interface FleetEtaxFile {
  id: string;
  fileName: string;
  uploadDate: string; // yyyy-mm-dd
  uploadedBy: string;
  status: FleetEtaxStatus;
  size: number; // bytes
}

// TODO: the real status will be set by the backend daily job.
export const FLEET_ETAX_STATUSES = ["Uploaded", "Waiting for transaction", "Matched", "Needs review"] as const;
export type FleetEtaxStatus = (typeof FLEET_ETAX_STATUSES)[number];

// Mock status by position in newest-first order (rows 1-14).
const MOCK_STATUS_BY_POSITION: FleetEtaxStatus[] = [
  "Uploaded", "Uploaded", "Uploaded",
  "Waiting for transaction", "Waiting for transaction", "Waiting for transaction",
  "Needs review",
  "Matched", "Matched", "Matched", "Matched", "Matched",
  "Needs review",
  "Matched",
];

const DATES = ["2026-10-02", "2026-10-01", "2026-09-30", "2026-09-29"];
const COUNTS = [4, 4, 3, 3];

function seed(): FleetEtaxFile[] {
  const rows: FleetEtaxFile[] = [];
  DATES.forEach((d, di) => {
    for (let i = 1; i <= COUNTS[di]; i++) {
      const name = `Invoice_${d.replace(/-/g, "")}_${String(i).padStart(3, "0")}.pdf`;
      rows.push({ id: name, fileName: name, uploadDate: d, uploadedBy: "RPA user", status: "Uploaded", size: 120_000 + di * 15_000 + i * 7_300 });
    }
  });
  rows
    .slice()
    .sort((a, b) => (a.uploadDate < b.uploadDate ? 1 : a.uploadDate > b.uploadDate ? -1 : a.fileName < b.fileName ? 1 : -1))
    .forEach((r, i) => { r.status = MOCK_STATUS_BY_POSITION[i] ?? "Uploaded"; });
  return rows;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// In-memory data layer. Replace each function with real API calls later.
// TODO: listFiles, uploadFiles, downloadFile -> backend endpoints
let store: FleetEtaxFile[] = seed();

export function useFleetEtaxFiles() {
  const [files, setFiles] = useState<FleetEtaxFile[]>(store);

  const listFiles = useCallback((from?: string, to?: string) => {
    return files
      .filter((f) => (!from || f.uploadDate >= from) && (!to || f.uploadDate <= to))
      .sort((a, b) => (a.uploadDate < b.uploadDate ? 1 : a.uploadDate > b.uploadDate ? -1 : a.fileName < b.fileName ? 1 : -1));
  }, [files]);

  const uploadFiles = useCallback((input: File[]) => {
    // TODO: duplicate file name / one-file-per-transaction rules (not decided)
    // TODO: file size / count limits (not decided)
    // TODO: specific error messages for failed uploads (not decided)
    // Matching to transactions is done by a separate nightly job.
    const date = todayIso();
    const added = input.map((f, i) => ({
      id: `${f.name}-${Date.now()}-${i}`,
      fileName: f.name,
      uploadDate: date,
      uploadedBy: "RPA user",
      status: "Uploaded" as FleetEtaxStatus,
      size: f.size,
    }));
    store = [...added, ...store];
    setFiles(store);
    return added.length;
  }, []);

  const downloadFile = useCallback((file: FleetEtaxFile) => {
    // TODO: connect the real file URL here (e.g. window.open(signedUrl))
    return file.fileName;
  }, []);

  return { listFiles, uploadFiles, downloadFile };
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
