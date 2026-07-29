import { request } from "@/helpers/request";
import type {
  CreateUserDto,
  GetUsersQueryParams,
  PaginatedUsersResponse,
  UserDto,
  UserUpdateDto,
} from "./users.dto";

const userService = (token: string) => ({
  // GET CURRENT USER
  getMe(): Promise<UserDto> {
    return request("/users/find", { token });
  },

  // GET USERS (pagination + filters)
  getUsers(params?: GetUsersQueryParams): Promise<PaginatedUsersResponse> {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        },
        {} as Record<string, string>,
      ),
    ).toString();

    return request(`/users?${query}`, { token });
  },

  // CREATE USER
  createUser(payload: CreateUserDto): Promise<UserDto> {
    return request("/users", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  // UPDATE USER (current user)
  updateUser(payload: UserUpdateDto): Promise<UserDto> {
    return request("/users", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },
});

export default userService;
