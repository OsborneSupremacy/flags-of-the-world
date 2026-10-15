export function newId(): string {
  // randomUUID needs a secure context, which localhost and the HTTPS site both are. The fallback is
  // for anything else; profile ids only have to be unique within one browser.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
