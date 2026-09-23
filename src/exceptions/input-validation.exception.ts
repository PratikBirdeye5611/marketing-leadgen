/**
 * Thrown when request data fails business validation.
 * Equivalent to InputValidationException.java — results in HTTP 400.
 */
export class InputValidationException extends Error {
  public readonly errorCode: string;
  public readonly params?: unknown[];
  public readonly reason?: string;
  public readonly level?: 'WARN' | 'ERROR' | 'INFO';

  constructor(
    errorCode: string,
    params?: unknown[],
    reason?: string,
    level: 'WARN' | 'ERROR' | 'INFO' = 'WARN',
  ) {
    super(reason ?? errorCode);
    this.name = 'InputValidationException';
    this.errorCode = errorCode;
    this.params = params;
    this.reason = reason;
    this.level = level;

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }
}
