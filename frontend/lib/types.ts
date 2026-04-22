export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

export type ApiError = {
  error: string;
  message: string;
  status: number;
  timestamp?: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
};

export type TokenResponse = {
  accessToken: string;
  expiresIn: number;
};

export type UserResponse = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type TenantResponse = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  settings: Record<string, unknown>;
  createdAt: string;
};

