export class ApiError extends Error {
  status?: number;
  fields?: Record<string, string>;
  raw?: any;

  constructor(message: string, status?: number, fields?: Record<string, string>, raw?: any) {
    super(message);
    this.status = status;
    this.fields = fields;
    this.raw = raw;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export default ApiError;
