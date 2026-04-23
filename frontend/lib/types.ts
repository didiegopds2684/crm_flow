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

export type TenantUserResponse = {
  id: string;
  tenantId: string;
  userId: string;
  role: string;
  createdAt: string;
};

export type RoleResponse = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  system: boolean;
  createdAt: string;
};

export type PolicyResponse = {
  id: string;
  tenantId: string;
  roleId: string;
  entitySlug: string;
  action: string;
  effect: string;
  priority: number;
  createdAt: string;
};

export type EntityFieldType =
  | "STRING"
  | "TEXT"
  | "NUMBER"
  | "BOOLEAN"
  | "EMAIL"
  | "URL"
  | "PHONE"
  | "DATE"
  | "ENUM"
  | "RELATION";

export type EntityFieldDefinition = {
  name: string;
  type: EntityFieldType;
  required: boolean;
  label: string | null;
  defaultValue?: unknown;
  validations?: Record<string, unknown> | null;
  options?: string[] | null;
};

export type EntityDefinitionResponse = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  displayName: string | null;
  description: string | null;
  icon: string | null;
  fields: EntityFieldDefinition[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EntityRecordResponse = {
  id: string;
  entityId: string;
  tenantId: string;
  data: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type EntityValidationError = {
  field: string;
  message: string;
};

export type EntityApiError = ApiError & {
  errors?: EntityValidationError[];
};
