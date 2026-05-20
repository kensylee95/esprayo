import { request } from "@/helpers/request";
import type {
  AuthResponse,
  GoogleLoginDto,
  LoginDto,
  PhoneSendOtpDto,
  PhoneVerifyOtpDto,
} from "./Auth.dto";

const authService = (token?: string) => ({
  // -----------------------------------s
  // EMAIL LOGIN
  // -----------------------------------
  login(payload: LoginDto): Promise<{ accessToken: AuthResponse }> {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  // -----------------------------------
  // PHONE AUTH - STEP 1 (SEND OTP)
  // -----------------------------------
  sendPhoneOtp(payload: PhoneSendOtpDto): Promise<{ message: string }> {
    return request("/auth/phone/send-otp", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  // -----------------------------------
  // PHONE AUTH - STEP 2 (VERIFY OTP)
  // -----------------------------------
  verifyPhoneOtp(payload: PhoneVerifyOtpDto): Promise<AuthResponse> {
    return request("/auth/phone/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  // -----------------------------------
  // GOOGLE LOGIN
  // -----------------------------------
  googleLogin(payload: GoogleLoginDto): Promise<AuthResponse> {
    return request("/auth/google", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },
});

export default authService;
