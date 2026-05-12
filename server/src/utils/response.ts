export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export function success<T = unknown>(data: T | null = null, message = 'ok'): ApiResponse<T> {
  return { code: 0, message, data };
}

export function fail(message = 'error', code = 1, data: unknown = null): ApiResponse {
  return { code, message, data };
}

export class AppError extends Error {
  statusCode: number;
  code: number;

  constructor(message: string, statusCode = 400, code = 1) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
