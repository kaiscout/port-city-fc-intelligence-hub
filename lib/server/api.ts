import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { env } from "@/lib/env";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function readJson(request: Request, limit = 2 * 1024 * 1024) {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "A JSON body is required");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new ApiError(413, "Request exceeds the 2 MB limit");
    }
    chunks.push(value);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}
export function requirePrivateDatabase() {
  if (env.PUBLIC_DEMO_MODE === "true" || !env.DATABASE_URL)
    throw new ApiError(
      403,
      "This demonstration is read-only. Sign in to a configured private organization to save records.",
    );
}
export async function apiResult(work: () => Promise<Response>) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof ApiError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError)
      return NextResponse.json(
        {
          error: error.issues
            .map((i) => `${i.path.join(".") || "Record"}: ${i.message}`)
            .join("; "),
        },
        { status: 422 },
      );
    const message = error instanceof Error ? error.message : "";
    if (["UNAUTHENTICATED", "SESSION_REVOKED", "INVALID_SESSION"].includes(message))
      return NextResponse.json(
        { error: "Your session has ended. Sign in again." },
        { status: 401 },
      );
    if (["FORBIDDEN", "CSRF_ORIGIN_REJECTED"].includes(message))
      return NextResponse.json(
        { error: "You do not have permission for this action." },
        { status: 403 },
      );
    if (typeof error === "object" && error && "code" in error && error.code === "23505")
      return NextResponse.json(
        { error: "That identity already exists. Refresh and edit the existing record." },
        { status: 409 },
      );
    console.error(
      JSON.stringify({
        event: "api.failed",
        type: error instanceof Error ? error.name : "unknown",
      }),
    );
    return NextResponse.json(
      {
        error:
          "The request could not be completed. No success has been confirmed; refresh before retrying.",
      },
      { status: 503 },
    );
  }
}
