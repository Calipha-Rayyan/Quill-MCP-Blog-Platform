export function assertNonEmpty(value: string, fieldName: string): void {
  if (!value || !value.trim()) throw new Error(`${fieldName} is required`);
}

export function assertEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email address");
  }
}
