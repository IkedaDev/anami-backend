import { User } from "../model/user.model";

export interface LoginResponse {
  token: string;
  user: User;
}
