export type ErrorCategory =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_STATE_TRANSITION"
  | "BUSINESS_RULE_VIOLATION"
  | "DATABASE_ERROR"
  | "PAYMENT_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND_ERROR"
  | "BUSINESS_RULE_ERROR";

export class AppError extends Error {
  public readonly isOperational = true;

  constructor(
    public override readonly message: string,
    public readonly category: ErrorCategory,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Unauthorized access to resource", statusCode = 403) {
    super(message, "AUTHORIZATION_ERROR", statusCode);
  }
}

export class NotFoundError extends AppError {
  constructor(resourceName: string, identifier?: string) {
    const msg = identifier ? `${resourceName} '${identifier}' was not found` : `${resourceName} not found`;
    super(msg, "NOT_FOUND_ERROR", 404);
  }
}

export class DatabaseError extends AppError {
  constructor(message = "A database error occurred", details?: unknown) {
    super(message, "DATABASE_ERROR", 500, details);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "BUSINESS_RULE_ERROR", 422, details);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
