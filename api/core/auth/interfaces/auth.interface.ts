export interface AdminJwtPayload {
  sub: number;
  email: string | null;
  roles: string[];
  dealerId: number | null;
}

export interface AdminLoginResponse {
  access_token: string;
  refresh_token: string;
  user: Record<string, unknown>;
}
