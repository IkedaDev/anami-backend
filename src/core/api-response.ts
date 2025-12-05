import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { PaginationMeta } from "./pagination";

// Interfaz Base (Meta opcional)
interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

interface IPaginatedApiResponse<T> extends IApiResponse<T> {
  meta: PaginationMeta;
}

export class ApiResponse {
  static success<T, S extends ContentfulStatusCode = 200>(
    c: Context,
    data: T,
    message: string = "Success",
    status: S = 200 as S
  ) {
    return c.json(
      {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
      } as IApiResponse<T>,
      status
    );
  }

  static successPaginated<T, S extends ContentfulStatusCode = 200>(
    c: Context,
    paginatedData: { data: T; meta: PaginationMeta },
    message: string = "Success",
    status: S = 200 as S
  ) {
    return c.json(
      {
        success: true,
        message,
        data: paginatedData.data,
        meta: paginatedData.meta,
        timestamp: new Date().toISOString(),
      } as IPaginatedApiResponse<T>,
      status
    );
  }

  // Método error
  static error<S extends ContentfulStatusCode = 400>(
    c: Context,
    message: string,
    errors: any = null,
    status: S = 400 as S
  ) {
    return c.json(
      {
        success: false,
        message,
        data: errors,
        timestamp: new Date().toISOString(),
      } as any,
      status
    );
  }
}
