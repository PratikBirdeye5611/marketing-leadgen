/**
 * General runtime exception for the leadgen service.
 * Equivalent to LeadGenException.java — results in HTTP 500.
 */
export class LeadGenException extends Error {
  public readonly errorCode?: string;
  public readonly params?: unknown[];

  constructor(errorCode: string, params?: unknown[]) {
    super(errorCode);
    this.name = 'LeadGenException';
    this.errorCode = errorCode;
    this.params = params;

    Error.captureStackTrace(this, this.constructor);
  }
}
