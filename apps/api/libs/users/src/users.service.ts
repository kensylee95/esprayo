import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuthProviderEnum,
  User,
  UserStatus,
  UserStatusEnum,
} from './entities/user.entity';
import { UserPayload } from '@modules/auth/src';
import {
  PaginatedResult,
  PaginationDto,
  UserFilter,
  UserManyFilter,
  UserResponse,
} from './users.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // -------------------------
  // MAPPER
  // -------------------------
  private mapToUserResponse = (user: User): UserResponse => ({
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    createdBy: user.createdBy,
    status: user.status,
  });

  // -------------------------
  // FINDERS
  // -------------------------
  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findUser(filter: UserFilter): Promise<UserResponse | null> {
    const user = await this.userRepository.findOne({
      where: filter,
    });

    return user ? this.mapToUserResponse(user) : null;
  }

  async findUsers(filter: UserManyFilter): Promise<UserResponse[]> {
    const users = await this.userRepository.find({
      where: filter,
    });

    return users.map(this.mapToUserResponse);
  }

  async findUsersPaginated(
    filter: UserManyFilter,
    queryParams: PaginationDto,
  ): Promise<PaginatedResult> {
    const { page = 1, limit = 10 } = queryParams;

    const [users, total] = await this.userRepository.findAndCount({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      users: users.map(this.mapToUserResponse),
      total,
      page,
      limit,
    };
  }
  async findUserByPhone(phoneNumber: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { phoneNumber } });
    if (!user) throw new Error('user not found');
    return this.mapToUserResponse(user);
  }

  async createPhoneUser(data: { phoneNumber: string }): Promise<UserResponse> {
    const user = this.userRepository.create({
      phoneNumber: data.phoneNumber,
      provider: AuthProviderEnum.Local,
      isActive: true,
      status: UserStatusEnum.Active,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.userRepository.save(user);
    return this.mapToUserResponse(saved);
  }
  // -------------------------
  // LOCAL USER (EMAIL/PASSWORD)
  // -------------------------
  async createLocalUser(
    user: {
      email?: string;
      phoneNumber?: string;
      password: string;
      firstName: string;
      lastName: string;
    },
    currentUser: UserPayload,
  ): Promise<UserResponse> {
    if (!user.email && !user.phoneNumber) {
      throw new BadRequestException('Either email or phone number is required');
    }
    if (user.email) {
      const existingEmail = await this.findUserByEmail(user.email);
      if (existingEmail) {
        throw new ConflictException('Email is already in use');
      }
    }

    if (user.phoneNumber) {
      const existingPhone = await this.findUserByPhone(user.phoneNumber);
      if (existingPhone) {
        throw new ConflictException('Phone number is already in use');
      }
    }

    const newUser = this.userRepository.create({
      email: user.email,
      phoneNumber: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      passwordHash: user.password,
      provider: AuthProviderEnum.Local,
      isActive: true,
      createdBy: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: UserStatusEnum.Active,
    });

    const saved = await this.userRepository.save(newUser);

    return this.mapToUserResponse(saved);
  }

  // -------------------------
  // GOOGLE USER (OAUTH)
  // -------------------------
  async createGoogleUser(user: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
  }): Promise<UserResponse> {
    const existingUser = await this.findUserByEmail(user.email);

    if (existingUser) {
      return this.mapToUserResponse(existingUser);
    }

    await this.userRepository.upsert(
      {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        passwordHash: null,
        provider: AuthProviderEnum.Google,
        googleId: user.googleId,
        isActive: true,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: UserStatusEnum.Active,
      },
      {
        conflictPaths: ['email'],
        skipUpdateIfNoValuesChanged: true,
      },
    );

    const saved = await this.userRepository.findOneByOrFail({
      email: user.email,
    });
    return this.mapToUserResponse(saved);
  }

  // -------------------------
  // UPDATE USER
  // -------------------------
  async updateUser(
    userId: string,
    data: {
      firstName: string;
      lastName: string;
      status: UserStatus;
    },
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.firstName = data.firstName;
    user.lastName = data.lastName;
    user.status = data.status;
    user.updatedAt = new Date();

    const updated = await this.userRepository.save(user);

    return this.mapToUserResponse(updated);
  }
}
