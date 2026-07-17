// Cliente HTTP mínimo. Os paths já incluem "/api/v1"; o Vite faz proxy para a API.
async function req(method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = (await res.json().catch(() => null)) as { erro?: string; detalhes?: string } | null;
  if (!res.ok) {
    throw new Error(data?.erro ?? data?.detalhes ?? `Erro ${res.status}`);
  }
  return data;
}

export const api = {
  get: (p: string) => req("GET", p),
  post: (p: string, b: unknown) => req("POST", p, b),
  put: (p: string, b: unknown) => req("PUT", p, b),
  del: (p: string) => req("DELETE", p),
};
