import { prisma } from "../../core/prisma"; // Ajusta la ruta si es necesario
import { z } from "zod";
import { createServiceSchema, updateServiceSchema } from "./services.schema";

type CreateServiceDTO = z.infer<typeof createServiceSchema>;
type UpdateServiceDTO = z.infer<typeof updateServiceSchema>;

export class ServicesService {
  async findAll() {
    return await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async findPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;

    // Ejecutamos ambas consultas en paralelo para mayor eficiencia
    const [total, data] = await Promise.all([
      prisma.service.count({ where: { isActive: true } }),
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    return await prisma.service.findUnique({
      where: { id, isActive: true },
    });
  }

  async create(data: CreateServiceDTO) {
    return await prisma.service.create({
      data: { ...data },
    });
  }

  // Actualizar
  async update(id: string, data: UpdateServiceDTO) {
    return await prisma.service.update({
      where: { id },
      data,
    });
  }

  // Eliminar (Soft Delete)
  async delete(id: string) {
    return await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
