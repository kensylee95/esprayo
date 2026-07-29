export const UserStatusEnum = {
  Active: "Active",
  Inactive: "Inactive",
} as const;

export type UserStatus = (typeof UserStatusEnum)[keyof typeof UserStatusEnum];

export const AuthProviderEnum = {
  Local: "Local",
  Google: "Google",
} as const;

export type AuthProvider =
  (typeof AuthProviderEnum)[keyof typeof AuthProviderEnum];

export type UserDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;

  status: UserStatus;

  provider?: AuthProvider;
  googleId?: string | null;
  isActive?: boolean;

  createdAt: string;
  updatedAt: string;
};

export type CreateUserDto = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export type UserUpdateDto = {
  firstName: string;
  lastName: string;
  status: UserStatus;
};

export type GetUsersQueryParams = {
  page?: number;
  limit?: number;
  status?: UserStatus;
};

export type PaginatedUsersResponse = {
  users: UserDto[];
  page: number;
  total: number;
  limit: number;
};
