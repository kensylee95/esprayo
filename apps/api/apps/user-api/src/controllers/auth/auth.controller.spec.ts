import { Test, TestingModule } from '@nestjs/testing'
import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { faker } from '@faker-js/faker'
import { UnauthorizedException } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from '@lib/auth'
import { UsersService, UserStatusEnum } from '@lib/users'
import { AuthUser } from './auth.dto'
import { User } from '@lib/users'

describe('AuthController', () => {
  let controller: AuthController
  let mockAuthService: DeepMocked<AuthService>
  let mockUsersService: DeepMocked<UsersService>

  beforeEach(async () => {
    mockAuthService = createMock<AuthService>()
    mockUsersService = createMock<UsersService>()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('signIn', () => {
    it('should authenticate user and return access token', async () => {
      // Arrange
      const loginDto: AuthUser = {
        email: faker.internet.email(),
        password: faker.internet.password(),
      }

      const user = {
        id: faker.string.uuid(),
        email: loginDto.email,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        passwordHash: faker.internet.password(),
        groupId: faker.string.uuid(),
        createdBy: 'system',
        updatedBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        status: UserStatusEnum.Active,
      }

      const expectedToken = faker.string.alphanumeric(64)

      mockUsersService.findUserByEmail.mockResolvedValue(user)
      mockAuthService.comparePasswords.mockResolvedValue(true)
      mockAuthService.generateToken.mockReturnValue(expectedToken)

      // Act
      const result = await controller.signIn(loginDto)

      // Assert
      expect(result).toEqual({ accessToken: expectedToken })
    })
    it('should throw error if email is not set', async () => {
      // Arrange
      const invalidLoginDto: Partial<AuthUser> = {
        password: faker.internet.password(),
      }

      // Act & Assert
      await expect(controller.signIn(invalidLoginDto as AuthUser)).rejects.toThrow('"email" is required')
    })

    it('should throw error if email is wrong type', async () => {
      // Arrange
      const invalidLoginDto: any = {
        email: 123,
        password: faker.internet.password(),
      }

      // Act & Assert
      await expect(controller.signIn(invalidLoginDto)).rejects.toThrow('"email" must be a string')
    })

    it('should throw error if password is not set', async () => {
      // Arrange
      const invalidLoginDto: Partial<AuthUser> = {
        email: faker.internet.email(),
      }

      // Act & Assert
      await expect(controller.signIn(invalidLoginDto as AuthUser)).rejects.toThrow('"password" is required')
    })

    it('should throw error if password is wrong type', async () => {
      // Arrange
      const invalidLoginDto: any = {
        email: faker.internet.email(),
        password: 123,
      }

      // Act & Assert
      await expect(controller.signIn(invalidLoginDto)).rejects.toThrow('"password" must be a string')
    })

    it('should throw UnauthorizedException if user is not found', async () => {
      // Arrange
      const loginDto: AuthUser = {
        email: faker.internet.email(),
        password: faker.internet.password(),
      }

      mockUsersService.findUserByEmail.mockResolvedValue(null)

      // Act & Assert
      await expect(controller.signIn(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      const loginDto: AuthUser = {
        email: faker.internet.email(),
        password: faker.internet.password(),
      }

      const user = new User({
        id: faker.string.uuid(),
        email: loginDto.email,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        passwordHash: faker.internet.password(),
        groupId: faker.string.uuid(),
        createdBy: 'system',
        updatedBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        status: 'Active',
      })

      mockUsersService.findUserByEmail.mockResolvedValue(user)
      mockAuthService.comparePasswords.mockResolvedValue(false)

      // Act & Assert
      await expect(controller.signIn(loginDto)).rejects.toThrow(UnauthorizedException)
    })
  })
})
