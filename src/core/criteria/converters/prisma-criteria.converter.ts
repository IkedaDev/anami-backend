// infrastructure/prisma/PrismaCriteriaConverter.ts
import {
  Criteria,
  FilterNode,
  Condition,
  LogicalGroup,
  FilterOperator,
} from "../criteria";

export class PrismaCriteriaConverter {
  /**
   * @param fieldMap Diccionario que traduce campos del dominio a campos de Prisma.
   * Ejemplo: { 'correoCliente': 'email', 'nombreEmpresa': 'company.name' }
   */
  constructor(private readonly fieldMap: Record<string, string> = {}) {}

  public convert(criteria: Criteria): any {
    const prismaQuery: any = {};

    if (criteria.hasFilters()) {
      prismaQuery.where = {
        AND: criteria.filters.map((filter) => this.buildFilter(filter)),
      };
    }

    if (criteria.orderBy) {
      // También mapeamos el campo de ordenamiento
      const mappedOrderBy = this.mapField(criteria.orderBy);
      prismaQuery.orderBy = this.buildNestedObject(
        mappedOrderBy,
        criteria.orderType,
      );
    }

    if (criteria.pagination?.limit !== undefined)
      prismaQuery.take = criteria.pagination.limit;
    if (criteria.pagination?.page !== undefined)
      prismaQuery.skip = (criteria.pagination.page - 1) * prismaQuery.take;

    return prismaQuery;
  }

  private buildFilter(node: FilterNode): any {
    if ("logic" in node) {
      const group = node as LogicalGroup;
      return {
        [group.logic]: group.filters.map((f) => this.buildFilter(f)),
      };
    }
    return this.buildCondition(node as Condition);
  }

  private buildCondition(condition: Condition): any {
    // 1. Traducimos el campo del dominio al campo de Prisma
    const mappedField = this.mapField(condition.field);

    // 2. Construimos la operación de Prisma (igual que antes)
    const operation = this.getPrismaOperation(
      condition.operator,
      condition.value,
    );

    // 3. Convertimos a objeto anidado por si hay relaciones (ej. 'company.name' -> { company: { name: operation } })
    return this.buildNestedObject(mappedField, operation);
  }

  /**
   * Traduce el campo. Si no está en el diccionario, puedes optar por lanzar
   * un error de "Campo no permitido" o usar el campo original por defecto.
   */
  private mapField(domainField: string): string {
    return this.fieldMap[domainField] || domainField;
  }

  /**
   * Convierte un string "user.company.name" en { user: { company: { name: value } } }
   * Esto es magia pura para hacer joins automáticos en Prisma mediante Criteria
   */
  private buildNestedObject(path: string, value: any): any {
    return path
      .split(".")
      .reverse()
      .reduce((acc, key) => ({ [key]: acc }), value);
  }

  private getPrismaOperation(operator: FilterOperator, value: any): any {
    switch (operator) {
      case FilterOperator.EQUAL:
        return value;
      case FilterOperator.CONTAINS:
        return { contains: value, mode: "insensitive" };
      case FilterOperator.NOT_EQUAL:
        return { not: value };
      case FilterOperator.GT:
        return { gt: value };
      case FilterOperator.GTE:
        return { gte: value };
      case FilterOperator.LT:
        return { lt: value };
      case FilterOperator.LTE:
        return { lte: value };
      case FilterOperator.IN:
        return { in: value };
      case FilterOperator.NOT_IN:
        return { notIn: value };
      default:
        throw new Error(`Operator ${operator} not supported`);
    }
  }
}
