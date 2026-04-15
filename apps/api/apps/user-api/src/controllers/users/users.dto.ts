import { UserStatus } from '@modules/users/src'

export type CreateUserDto = {
  email: string
  firstName: string
  lastName: string
  password: string
}

export type UserUpdateDto = {
  firstName: string
  lastName: string
  status: UserStatus
}

export type UserDto = {
  id: string
  email: string
  firstName: string
  lastName: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  status: UserStatus
}
export type GetUsersQueryParams = {
  page?: number
  limit?: number
  status?: UserStatus
}

export type PaginatedUsersResponse = {
  users: UserDto[]
  page: number
  total: number
  limit: number
}
