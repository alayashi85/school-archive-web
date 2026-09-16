export type UserRole = "ADMIN" | "USER";

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface LoginResponse {
  ok: boolean;
  token: string;
  expiresIn: number;
  user: AuthUser;
}