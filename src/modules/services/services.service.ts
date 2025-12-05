import { prisma } from "../../core/prisma"; // Ajusta la ruta si es necesario
import { z } from "zod";
import { createServiceSchema, updateServiceSchema } from "./services.schema";

type CreateServiceDTO = z.infer<typeof createServiceSchema>;
type UpdateServiceDTO = z.infer<typeof updateServiceSchema>;

export class ServicesService {
  // Listar solo los activos
  async findAll() {
    return await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  // Buscar por ID
  async findOne(id: string) {
    return await prisma.service.findUnique({
      where: { id, isActive: true },
    });
  }

  // Crear
  async create(data: CreateServiceDTO) {
    return await prisma.service.create({
      data: {
        ...data,
        isActive: true,
      },
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
      data: { isActive: false }, // Marcamos como inactivo, no borramos
    });
  }
}
