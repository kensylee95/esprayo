import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User, UserStatus, UserStatusEnum } from './entities/user.entity'
import { ApiUser, UserPayload } from '@modules/auth/src'
import { PaginatedResult, PaginationDto, UserFilter, UserManyFilter, UserResponse } from './users.interface'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

  private mapToUserResponse = (user: User): UserResponse => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    createdBy: user.createdBy,
    status: user.status,
  })

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    })
  }

  async findUser(filter: UserFilter): Promise<UserResponse | null> {
    const user = await this.userRepository.findOne({
      where: filter,
    })

    return user ? this.mapToUserResponse(user) : null
  }

  async findUsers(filter: UserManyFilter): Promise<UserResponse[]> {
    const users = await this.userRepository.find({
      where: filter,
    })

    return users.map((user) => this.mapToUserResponse(user))
  }

  async findUsersPaginated(filter: UserManyFilter, queryParams: PaginationDto): Promise<PaginatedResult> {
    const { page = 1, limit = 10 } = queryParams
    const [users, total] = await this.userRepository.findAndCount({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    })

    return { users: users.map((user) => this.mapToUserResponse(user)), total, page, limit }
  }

  async createUser(
    user: {
      email: string
      password: string
      firstName: string
      lastName: string
    },
    currentUser: UserPayload
  ): Promise<UserResponse> {
    const existingUser = await this.userRepository.findOne({ where: { email: user.email } })
    if (existingUser) {
      throw new Error('Email is already in use')
    }

    const newUser = new User({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      passwordHash: user.password,
      isActive: true,
      createdBy: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: UserStatusEnum.Active,
    })

    const savedUser = await this.userRepository.save(newUser)
    return this.mapToUserResponse(savedUser)
  }

  async updateUser(
    userId: string,
    data: { firstName: string; lastName: string; status: UserStatus }
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) throw new Error('User with id not found')

    user.firstName = data.firstName
    user.lastName = data.lastName
    user.status = data.status
    user.updatedAt = new Date()

    const updatedUser = await this.userRepository.save(user)
    return this.mapToUserResponse(updatedUser)
  }
}
