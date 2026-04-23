import { UserStatus } from './entities'

export type PaginationDto = {
  page?: number
  limit?: number
}
export type UserResponse = {
  id: string
  email: string
  firstName: string
  lastName: string
  status: UserStatus
  createdBy: string|null
  createdAt: Date
  updatedAt: Date
}

export interface PaginatedResult {
  users: UserResponse[]
  page: number
  total: number
  limit: number
}

export type UserFilter =
  | {
      id: string
      email?: string
      groupId?: string
    }
  | {
      id?: string
      email: string
      groupId?: string
    }

export interface UserManyFilter {
  groupId?: string
  status?: UserStatus
  email?: string
}
