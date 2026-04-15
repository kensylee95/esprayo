import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

export const UserStatusEnum = {
  Active: 'Active',
  Inactive: 'Inactive',
} as const

export type UserStatus = (typeof UserStatusEnum)[keyof typeof UserStatusEnum]
@Entity({ name: 'users' })
export class User {
  constructor(partial: Omit<User, 'id'> & { id?: string }) {
    Object.assign(this, partial)
  }

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'email' })
  email: string

  @Column({ name: 'first_name' })
  firstName: string

  @Column({ name: 'last_name' })
  lastName: string

  @Column({ name: 'password_hash' })
  passwordHash: string

  @Column({ name: 'status' })
  status: UserStatus

  @Column({ name: 'created_by' })
  createdBy: string

  @Column({ name: 'created_at' })
  createdAt: Date

  @Column({ name: 'updated_at' })
  updatedAt: Date

  @Column({ name: 'is_active' })
  isActive: boolean
}
