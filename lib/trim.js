export function trimTitle(str) {
  return str.trim().replace(/\s\s+/g, " ");
}

export function trimBody(str) {
  return str.trim().replace(/\n\s*\n\s*\n/g, "\n\n");
}
