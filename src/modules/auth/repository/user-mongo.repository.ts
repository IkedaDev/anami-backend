import { prisma } from "../../../core/prisma";
import { FindByRequest } from "../domain/dto/find-by-request.dto";
import { User } from "../domain/model/user.model";
import { UserRepository } from "../domain/repository/user.repository";

export class UserMongoRepository implements UserRepository {
  async findBy(req: FindByRequest): Promise<User | null> {
    const where: FindByRequest = {};
    if (req.id) where.id = req.id;
    if (req.isActive) where.isActive = req.isActive;
    if (req.email) where.email = req.email;

    const user = await prisma.user.findUnique({
      where: where as any,
    });

    if (!user) return null;

    return new User({
      id: user?.id,
      email: user?.email,
      name: user?.fullName,
      role: user?.role,
      password: user.password,
    });
  }
}
