export interface AuthResponse {
  accessToken: string;
}

export interface AuthError {
  message: string;
  statusCode: number;
}

export type LoginDto = {
  email: string;
  password: string;
};

export type PhoneSendOtpDto = {
  phoneNumber: string;
};

export type PhoneVerifyOtpDto = {
  phoneNumber: string;
  pin: string;
};

export type GoogleLoginDto = {
  token: string;
};
