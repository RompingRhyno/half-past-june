export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFKD") // normalize accented chars
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanum with dashes
    .replace(/^-+|-+$/g, ""); // remove leading/trailing dashes
}
