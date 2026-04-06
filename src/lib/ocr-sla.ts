/** Client-side SLA for OCR pipeline (spec 0.3 — end-to-end target & timeout UX). */
export const OCR_END_TO_END_TIMEOUT_MS = 10_000;

export const OCR_TIMEOUT_MESSAGE_TH =
  "ไม่สามารถประมวลผล OCR ได้ในขณะนี้ — กรุณาลองใหม่";

export function isFetchAbortOrTimeout(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error && err.name === "AbortError") return true;
  if (err instanceof Error && /aborted|timeout|signal is aborted/i.test(err.message)) return true;
  return false;
}
