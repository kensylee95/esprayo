export interface AuthResponse {
  accessToken: string;
}

export interface AuthError {
  message: string;
  statusCode: number;
}
