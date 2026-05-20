import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import termiiConfig from './termii.config';
import {
  BalanceResponse,
  SendBulkSmsDto,
  SendOtpDto,
  SendOtpResponse,
  SendSmsDto,
  SendSmsResponse,
  VerifyOtpDto,
  VerifyOtpResponse,
} from './termii.interfaces';
import { TERMII_BASE_URL } from './termii.constants';

@Injectable()
export class TermiiService {
  private readonly logger = new Logger(TermiiService.name);
  private readonly baseUrl: string;

  constructor(
    @Inject(termiiConfig.KEY)
    private readonly config: ConfigType<typeof termiiConfig>,
  ) {
    this.baseUrl = config.baseUrl ?? TERMII_BASE_URL;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async post<T>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: this.config.apiKey, ...body }),
    });

    const data = (await res.json()) as T;

    if (!res.ok) {
      const err = data as Record<string, unknown>;
      this.logger.error(
        `Termii API error [${res.status}]: ${JSON.stringify(data)}`,
      );
      throw new Error(
        typeof err?.message === 'string'
          ? err.message
          : `Termii request failed with status ${res.status}`,
      );
    }

    return data;
  }

  private async get<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const query = new URLSearchParams({
      api_key: this.config.apiKey,
      ...params,
    });
    const url = `${this.baseUrl}${path}?${query}`;
    const res = await fetch(url);

    const data = (await res.json()) as T;

    if (!res.ok) {
      const err = data as Record<string, unknown>;
      this.logger.error(
        `Termii API error [${res.status}]: ${JSON.stringify(data)}`,
      );
      throw new Error(
        typeof err?.message === 'string'
          ? err.message
          : `Termii request failed with status ${res.status}`,
      );
    }

    return data;
  }

  // ── SMS ────────────────────────────────────────────────────────────────────

  async sendSms(dto: SendSmsDto): Promise<SendSmsResponse> {
    const body: Record<string, unknown> = {
      to: dto.to,
      from: dto.from ?? this.config.senderId ?? 'N-Alert',
      sms: dto.sms,
      type: dto.type ?? 'plain',
      channel: dto.channel ?? 'generic',
    };

    if (dto.mediaUrl) {
      body.media = { url: dto.mediaUrl, caption: dto.mediaCaption ?? '' };
    }

    return this.post<SendSmsResponse>('/api/sms/send', body);
  }

  async sendBulkSms(dto: SendBulkSmsDto): Promise<SendSmsResponse> {
    return this.post<SendSmsResponse>('/api/sms/send/bulk', {
      to: dto.to,
      from: dto.from ?? this.config.senderId ?? 'N-Alert',
      sms: dto.sms,
      type: dto.type ?? 'plain',
      channel: dto.channel ?? 'generic',
    });
  }

  // ── OTP / Token ────────────────────────────────────────────────────────────

  async sendOtp(dto: SendOtpDto): Promise<SendOtpResponse> {
    const raw = await this.post<SendOtpResponse>('/api/sms/otp/send', {
      to: dto.to,
      from: dto.from ?? this.config.senderId ?? 'N-Alert',
      channel: dto.channel ?? 'generic',
      pin_attempts: dto.pinAttempts ?? 3,
      pin_time_to_live: dto.pinTimeToLive ?? 10,
      pin_placeholder: '< 123456 >',
      message_text: 'Your one time authentication pin is < 12345678 >',
      pin_length: dto.pinLength ?? 6,
      pin_type: dto.pinType ?? 'NUMERIC',
    });

    return {
      pinId: raw.pinId,
      to: raw.to,
      smsStatus: raw.smsStatus,
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    const raw = await this.post<VerifyOtpResponse>('/api/sms/otp/verify', {
      pin_id: dto.pinId,
      pin: dto.pin,
    });

    return {
      pinId: raw.pinId,
      verified: raw.verified,
      msisdn: raw.msisdn,
    };
  }

  // ── Account ────────────────────────────────────────────────────────────────

  async getBalance(): Promise<BalanceResponse> {
    return this.get<BalanceResponse>('/api/get-balance');
  }
}
