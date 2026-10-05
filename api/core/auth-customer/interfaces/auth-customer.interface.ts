export interface CustomerJwtPayload {
  sub: number;
  email: string;
  dealerId: number;
}

export interface CustomerLoginResponse {
  access_token: string;
  refresh_token: string;
  customer: Record<string, unknown>;
}
