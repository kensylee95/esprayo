import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService, UserStatusEnum } from '@modules/users/src';
import * as uuid from 'uuid';
import * as Joi from 'joi';
import type {
  CreateUserDto,
  GetUsersQueryParams,
  PaginatedUsersResponse,
  UserDto,
  UserUpdateDto,
} from './users.dto';
import { CurrentUser, AuthService, type UserPayload } from '@modules/auth/src';
import { WalletService } from '@modules/wallet/wallet.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly walletService: WalletService,
  ) {}

  @Post()
  async createUser(
    @CurrentUser() currentUser: UserPayload,
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserDto> {
    const schema = Joi.object<CreateUserDto>({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().required(),
      password: Joi.string().required(),
    });

    const validationResult = schema.validate(createUserDto);

    if (validationResult.error) {
      throw new BadRequestException(validationResult.error.message);
    }
    const hashedPassword = await this.authService.hashPassword(
      validationResult.value.password,
    );

    const user = await this.usersService.createLocalUser(
      {
        ...validationResult.value,
        password: hashedPassword,
      },
      currentUser,
    );
    await this.walletService.createWallet(user.id);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      status: user.status,
    };
  }

  @Get()
  async findAll(
    @Query() paginationData: GetUsersQueryParams,
  ): Promise<PaginatedUsersResponse> {
    const paginationSchema = Joi.object<GetUsersQueryParams>({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(200).default(10),
      status: Joi.string()
        .trim()
        .valid(UserStatusEnum.Active, UserStatusEnum.Inactive)
        .optional(),
    });
    const validationResult = paginationSchema.validate(paginationData);
    if (validationResult.error) {
      throw new BadRequestException(validationResult.error.message);
    }
    const { limit, page, ...filters } = validationResult.value;
    return await this.usersService.findUsersPaginated(
      { ...filters },
      { limit, page },
    );
  }
  @Get('find')
  async findOne(@CurrentUser('id') id: string): Promise<UserDto | null> {
    if (!uuid.validate(id)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.usersService.findUser({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Post(':id')
  async updateUser(
    @CurrentUser() currentUser: UserPayload,
    @Body() updateDto: UserUpdateDto,
  ): Promise<UserDto> {
    const schema = Joi.object<UserUpdateDto>({
      firstName: Joi.string().trim().required(),
      lastName: Joi.string().allow('').trim().required(),
      status: Joi.string().valid(...Object.values(UserStatusEnum)),
    });

    const validationResult = schema.validate(updateDto);
    if (validationResult.error) {
      throw new BadRequestException(validationResult.error.message);
    }

    const { firstName, lastName, status } = validationResult.value;

    const user = await this.usersService.updateUser(currentUser.id, {
      firstName,
      lastName,
      status,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      status: user.status,
    };
  }
}
