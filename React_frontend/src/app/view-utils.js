export function listOrEmpty(content, empty) {
  return Array.isArray(content) ? (content.some(Boolean) ? content : empty) : content || empty;
}
