export interface UserPayload {
  id: string;
  email?: string;
  phoneNumber?: string;
}

export type GoogleTokenResponse = {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
};
