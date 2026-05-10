import { FindByRequest } from "../dto/find-by-request.dto";
import { User } from "../model/user.model";

export abstract class UserRepository {
  abstract findBy(req: FindByRequest): Promise<User | null>;
}
