export function readAccessToken(request: Request) {
  const header = request.headers.get("authorization")?.trim();

  if (!header) {
    return null;
  }

  const bearer = /^Bearer\s+(\S+)$/i.exec(header);

  if (bearer?.[1]) {
    return bearer[1];
  }

  if (header.split(".").length === 3) {
    return header;
  }

  return null;
}
