/** Tries these paths (first success wins) — adjust if backend uses a different route */
export function documentBlobPaths(documentId: string): string[] {
  return [`/documents/${documentId}/download`, `/documents/${documentId}/file`];
}
