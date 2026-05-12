import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ApiResponse } from "@core/api-response";
import { ContentfulStatusCode } from "hono/utils/http-status";

interface APIResponseProps {
  message?: string;
  status?: ContentfulStatusCode;
  type?: TypeResponse;
}

type ApiResponseFn =
  | typeof ApiResponse.success
  | typeof ApiResponse.successPaginated;

export enum TypeResponse {
  PAGINATED = "PAGINATED",
  DEFAULT = "DEFAULT",
}

const fncToResponse: Record<TypeResponse, ApiResponseFn> = {
  [TypeResponse.PAGINATED]: ApiResponse.successPaginated,
  [TypeResponse.DEFAULT]: ApiResponse.success,
};

export function APIResponse(props: string | APIResponseProps = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const c = args[0] as Context;

      // Valores por defecto
      let message = "Success";
      let status: ContentfulStatusCode = 200;
      let type = TypeResponse.DEFAULT;

      if (typeof props === "string") {
        message = props;
      } else {
        message = props.message ?? message;
        status = props.status ?? status;
        type = props.type ?? type;
      }

      try {
        const response = await originalMethod.apply(this, args);
        const responder = fncToResponse[type];
        return responder(c, response, message, status);
      } catch (error: any) {
        let errorStatus: ContentfulStatusCode = 500;
        let finalMessage = "Error Interno del Servidor";

        if (error instanceof HTTPException) {
          errorStatus = error.status;
          if (error.message) finalMessage = error.message;
        }

        console.error(`[IkedaDev Handler Log] Error en ${propertyKey}:`, error);

        return ApiResponse.error(c, finalMessage, null, errorStatus);
      }
    };

    return descriptor;
  };
}
