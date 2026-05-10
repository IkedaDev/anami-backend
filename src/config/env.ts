import "dotenv/config";
import env from "env-var";

export class Envs {
  static JWT_SECRET: string = env.get("JWT_SECRET").required().asString();
  static API_PUBLIC_PATH?: string = env.get("API_PUBLIC_PATH").asString();
  static DATABASE_URL: string = env.get("DATABASE_URL").required().asString();
  static LOGGER_SERVICE_URL: string = env
    .get("LOGGER_SERVICE_URL")
    .required()
    .asString();
  static LOGGER_API_KEY: string = env
    .get("LOGGER_API_KEY")
    .required()
    .asString();
  static NODE_ENV: string = env.get("NODE_ENV").required().asString();
}
