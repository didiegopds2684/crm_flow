import { backendFetch, forwardJson } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const response = await backendFetch("/api/v1/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body
  });

  return forwardJson(response);
}

