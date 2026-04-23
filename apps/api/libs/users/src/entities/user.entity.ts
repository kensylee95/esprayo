import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

export const UserStatusEnum = {
  Active: 'Active',
  Inactive: 'Inactive',
} as const

export type UserStatus =
  (typeof UserStatusEnum)[keyof typeof UserStatusEnum]

export const AuthProviderEnum = {
  Local: 'Local',
  Google: 'Google',
} as const

export type AuthProvider =
  (typeof AuthProviderEnum)[keyof typeof AuthProviderEnum]

@Entity({ name: 'users' })
export class User {
  constructor(partial: Partial<User>) {
    Object.assign(this, partial)
  }

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, type: 'text' })
  email: string

  @Column({ type: 'text', name: 'first_name' })
  firstName: string

  @Column({ type: 'text', name: 'last_name' })
  lastName: string

  @Column({ type: 'text', nullable: true, name: 'password_hash' })
  passwordHash: string | null

  @Column({ enum: AuthProviderEnum, default: 'Local' })
  provider: AuthProvider

  @Column({ type: 'text', nullable: true, name: 'google_id' })
  googleId: string | null

  @Column({ enum: UserStatusEnum, default: 'Active' })
  status: UserStatus

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string | null

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date

  @Column({ default: true, name: 'is_active' })
  isActive: boolean
}