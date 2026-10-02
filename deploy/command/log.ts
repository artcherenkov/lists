export function step(message: string): void {
  console.log(`→ ${message}`);
}

export function detail(message: string): void {
  console.log(`  ${message}`);
}

export function warn(message: string): void {
  console.warn(`! ${message}`);
}
