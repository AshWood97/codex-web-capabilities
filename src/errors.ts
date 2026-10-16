export class CwcError extends Error {
  constructor(public code: string, message: string, public details?: unknown) { super(message); }
}
export function assert(value: unknown, code: string, message: string): asserts value {
  if (!value) throw new CwcError(code, message);
}
export function errorResult(error: unknown) {
  return error instanceof CwcError
    ? { error: { code: error.code, message: error.message, details: error.details } }
    : { error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : String(error) } };
}
