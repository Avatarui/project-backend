
import { JwtPayload as JWTPayloadBase } from "jsonwebtoken";

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegister {
  email: string;
  password: string;
  username: string;
  birthday?: string;
}

export interface AdminRegister {
  email: string;
  password: string;
  username: string;
}

export interface UserRow {
  role: string;
}

export interface JwtPayload extends JWTPayloadBase {
  userId: string;
  role: string;
}

export interface LoginWithEmailRequest {
  idToken: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  photo_url?: string;
  role: string;
  status: string;
  birthday?: string;
}
