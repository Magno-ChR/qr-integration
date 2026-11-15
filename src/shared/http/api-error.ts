import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const noStore = { "Cache-Control": "no-store" };

export function apiJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore });
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { result: error.code, message: error.message },
      { status: error.status, headers: { ...noStore, ...error.headers } },
    );
  }

  console.error(error);
  return apiJson(
    { result: "COD500", message: "Error interno del servidor." },
    500,
  );
}
