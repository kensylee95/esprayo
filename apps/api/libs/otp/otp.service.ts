import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Otp } from './entities/otp.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {}

  async createOtp(data: {
    phone: string;
    pinId: string;
    expiresAt: Date;
  }): Promise<Otp> {
    const otp = this.otpRepository.create(data);
    return this.otpRepository.save(otp);
  }

  async findByPhone(phone: string): Promise<Otp | null> {
    return this.otpRepository.findOne({ where: { phone } });
  }

  async deleteByPhone(phone: string): Promise<void> {
    await this.otpRepository.delete({ phone });
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.otpRepository.increment({ id }, 'attempts', 1);
  }
}
