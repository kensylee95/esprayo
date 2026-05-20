export type TermiiChannel = 'generic' | 'dnd' | 'whatsapp';
export type TermiiMessageType = 'plain' | 'unicode';
export type TermiiPinType = 'NUMERIC' | 'ALPHANUMERIC' | 'ALPHABET';

// ── SMS ──────────────────────────────────────────────────────────────────────

export interface SendSmsDto {
  to: string;
  sms: string;
  from?: string;
  channel?: TermiiChannel;
  type?: TermiiMessageType;
  mediaUrl?: string;
  mediaCaption?: string;
}

export interface SendBulkSmsDto {
  to: string[];
  sms: string;
  from?: string;
  channel?: TermiiChannel;
  type?: TermiiMessageType;
}

export interface SendSmsResponse {
  message_id: string;
  message: string;
  balance: number;
  user: string;
  code: string;
}

// ── OTP / Token ──────────────────────────────────────────────────────────────

export interface SendOtpDto {
  to: string;
  from?: string;
  channel?: TermiiChannel;
  pinAttempts?: number;
  pinTimeToLive?: number; // minutes
  pinLength?: number;
  pinType?: TermiiPinType;
}

export interface VerifyOtpDto {
  pinId: string;
  pin: string;
}

export interface SendOtpResponse {
  pinId: string;
  to: string;
  smsStatus: string;
}

export interface VerifyOtpResponse {
  pinId: string;
  verified: string;
  msisdn: string;
}

// ── Balance ──────────────────────────────────────────────────────────────────

export interface BalanceResponse {
  user: string;
  balance: number;
  currency: string;
}
