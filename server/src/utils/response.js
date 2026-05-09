export function success(data = null, message = 'ok') {
  return { code: 0, message, data };
}

export function fail(message = 'error', code = 1, data = null) {
  return { code, message, data };
}

export class AppError extends Error {
  constructor(message, statusCode = 400, code = 1) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
