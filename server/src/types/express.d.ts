export interface JwtPayload {
  id: number;
  username: string;
  roleId: number;
  roleCode: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
