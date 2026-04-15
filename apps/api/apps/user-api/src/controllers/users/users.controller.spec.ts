import { Test, TestingModule } from '@nestjs/testing'
import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { faker } from '@faker-js/faker'
import { UsersController } from './users.controller'
import { CreateUserDto, GetUsersQueryParams, PaginatedUsersResponse, UserDto, UserUpdateDto } from './users.dto'
import { User, UsersService, UserStatusEnum } from '@lib/users'
import { AuthService } from '@lib/auth/auth.service'
import { UserResponse } from '@lib/users/users.interface'
import { ApiUser } from '@lib/auth'

describe('UsersController', () => {
  let controller: UsersController
  let mockUsersService: DeepMocked<UsersService>
  let mockAuthService: DeepMocked<AuthService>

  const currentUser: ApiUser = { email: 'test-email.com', id: 'user-id', groupId: 'group-id' }
  beforeEach(async () => {
    mockUsersService = createMock<UsersService>()
    mockAuthService = createMock<AuthService>()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile()

    controller = module.get<UsersController>(UsersController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userDto: CreateUserDto = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        groupId: faker.string.uuid(),
        password: faker.internet.password(),
      }

      const savedUser = {
        id: faker.string.uuid(),
        firstName: userDto.firstName,
        lastName: userDto.lastName,
        email: userDto.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        groupId: userDto.groupId,
        createdBy: 'Admin',
        updatedBy: 'Admin',
        isActive: true,
        passwordHash: '1qs2',
        status: UserStatusEnum.Active,
      }
      const expectedResponse = {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        groupId: savedUser.groupId,
        createdAt: savedUser.createdAt,
        createdBy: savedUser.createdBy,
        updatedBy: savedUser.updatedBy,
        updatedAt: savedUser.updatedAt,
        status: UserStatusEnum.Active,
      }
      mockUsersService.createUser.mockResolvedValue(savedUser)

      const result = await controller.createUser(currentUser, userDto)
      expect(result).toEqual(expectedResponse)
    })

    it('should throw error if firstName is not set', async () => {
      const invalidUserDto: Partial<CreateUserDto> = {
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        groupId: faker.string.uuid(),
        password: faker.internet.password(),
      }
      await expect(controller.createUser(currentUser, invalidUserDto as CreateUserDto)).rejects.toThrow(
        '"firstName" is required'
      )
    })

    it('should throw error if firstName is wrong type', async () => {
      const invalidUserDto: any = { firstName: 1 }
      await expect(controller.createUser(currentUser, invalidUserDto as CreateUserDto)).rejects.toThrow(
        '"firstName" must be a string'
      )
    })
    it('should throw error if lastName is not set', async () => {
      const invalidUserDto: Partial<CreateUserDto> = {
        firstName: faker.person.firstName(),
        email: faker.internet.email(),
        groupId: faker.string.uuid(),
        password: faker.internet.password(),
      }
      await expect(controller.createUser(currentUser, invalidUserDto as CreateUserDto)).rejects.toThrow(
        '"lastName" is required'
      )
    })

    describe('updateUSer', () => {
      it('should update the User and return updated data', async () => {
        const date = new Date()
        const userId = faker.string.uuid()

        const updateDto: UserUpdateDto = {
          firstName: 'Aba',
          lastName: 'Nnamani',
          status: UserStatusEnum.Active,
        }
        const serviceReturnValue: User = {
          ...updateDto,
          id: userId,
          createdAt: date,
          createdBy: faker.string.uuid(),
          updatedBy: faker.string.uuid(),
          updatedAt: new Date(),
          email: faker.internet.email(),
          passwordHash: 'hash',
          groupId: currentUser.groupId,
          isActive: true,
        }

        const expectedResponse: UserDto = {
          id: userId,
          firstName: updateDto.firstName,
          groupId: currentUser.groupId,
          email: serviceReturnValue.email,
          lastName: updateDto.lastName,
          createdAt: serviceReturnValue.createdAt,
          updatedAt: serviceReturnValue.updatedAt,
          status: serviceReturnValue.status,
          createdBy: serviceReturnValue.createdBy,
          updatedBy: serviceReturnValue.updatedBy,
        }

        mockUsersService.updateUser.mockResolvedValue(serviceReturnValue)

        const result = await controller.updateUser(userId, currentUser, updateDto)
        expect(result).toMatchObject(expectedResponse)
      })
    })
    describe('findAll', () => {
      it('should return paginated Users', async () => {
        const paginationDto: GetUsersQueryParams = {
          limit: 10,
          page: 1,
        }
        const savedUser: UserResponse = {
          id: faker.string.uuid(),
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: faker.internet.email(),
          createdAt: new Date(),
          updatedAt: new Date(),
          groupId: currentUser.groupId,
          createdBy: 'Admin',
          updatedBy: 'Admin',
          status: UserStatusEnum.Active,
        }

        const expectedResult: PaginatedUsersResponse = {
          users: [savedUser],
          page: paginationDto.page!,
          total: 1,
          limit: paginationDto.limit!,
        }

        mockUsersService.findUsersPaginated.mockResolvedValue(expectedResult)

        const result = await controller.findAll(paginationDto, currentUser.groupId)

        expect(result).toMatchObject(expectedResult)
        expect(result.users).toHaveLength(1)
      })
    })

    it('should throw error if lastName is wrong type', async () => {
      const invalidUserDto: any = {
        firstName: faker.person.firstName(),
        lastName: 1,
        email: faker.internet.email(),
        groupId: faker.string.uuid(),
        password: faker.internet.password(),
      }
      await expect(controller.createUser(currentUser, invalidUserDto as CreateUserDto)).rejects.toThrow(
        '"lastName" must be a string'
      )
    })

    it('should throw error if email is not set', async () => {
      const invalidUserDto: Partial<CreateUserDto> = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        groupId: faker.string.uuid(),
        password: faker.internet.password(),
      }
      await expect(controller.createUser(currentUser, invalidUserDto as CreateUserDto)).rejects.toThrow(
        '"email" is required'
      )
    })

    it('should throw error if email is wrong type', async () => {
      const invalidUserDto: any = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: 10,
        groupId: faker.string.uuid(),
        password: faker.internet.password(),
      }
      await expect(controller.createUser(currentUser, invalidUserDto as CreateUserDto)).rejects.toThrow(
        '"email" must be a string'
      )
    })

    it('should throw error if groupId is not set', async () => {
      const invalidUserDto: Partial<CreateUserDto> = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      }
      await expect(controller.createUser(currentUser, invalidUserDto as CreateUserDto)).rejects.toThrow(
        '"groupId" is required'
      )
    })

    it('should throw error if groupId is wrong type', async () => {
      const invalidUserDto: any = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        groupId: 90,
        password: faker.internet.password(),
      }
      await expect(controller.createUser(currentUser, invalidUserDto as CreateUserDto)).rejects.toThrow(
        '"groupId" must be a string'
      )
    })

    it('should throw error if password is not set', async () => {
      const invalidUserDto: Partial<CreateUserDto> = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        groupId: faker.string.uuid(),
      }
      await expect(controller.createUser(currentUser, invalidUserDto as CreateUserDto)).rejects.toThrow(
        '"password" is required'
      )
    })

    it('should throw error if password is wrong type', async () => {
      const invalidUserDto: any = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        groupId: faker.string.uuid(),
        password: 23,
      }
      await expect(controller.createUser(currentUser, invalidUserDto as CreateUserDto)).rejects.toThrow(
        '"password" must be a string'
      )
    })
  })
})
