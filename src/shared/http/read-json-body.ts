import { ApiError } from "@/shared/http/api-error";

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(
      "COD003",
      "El cuerpo de la solicitud no es JSON válido.",
      400,
    );
  }
}
