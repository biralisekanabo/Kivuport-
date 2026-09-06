export function pdfText(value: string): string {
  return value.replace(/[\u00a0\u202f]/g, " ");
}
