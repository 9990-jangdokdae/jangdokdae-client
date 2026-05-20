export function resolveApiBase(apiBase: string | undefined, nodeEnv: string | undefined) {
  if (apiBase) return apiBase;
  if (nodeEnv !== "production") return "http://localhost:8000";

  throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production");
}

export const API_BASE = resolveApiBase(
  process.env.NEXT_PUBLIC_API_BASE_URL,
  process.env.NODE_ENV,
);
export const API_V1_BASE = `${API_BASE}/api/v1`;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export const apiFetch = (path: string, options?: RequestInit) =>
  fetch(`${API_BASE}${path}`, { credentials: "include", ...options });

let _refreshPromise: Promise<boolean> | null = null;

async function _tryRefresh(): Promise<boolean> {
  if (!_refreshPromise) {
    _refreshPromise = apiFetch("/api/v1/auth/refresh", { method: "POST" })
      .then(async (r) => {
        if (r.ok) return true;
        const body: { detail?: string } = await r.json().catch(() => ({}));
        if (body.detail?.includes("보안 위협")) {
          window.dispatchEvent(
            new CustomEvent("auth:security-threat", { detail: body.detail }),
          );
        }
        return false;
      })
      .finally(() => {
        _refreshPromise = null;
      });
  }
  return _refreshPromise;
}

export async function apiFetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(path, options);

  if (response.status === 401 && path !== "/api/v1/auth/refresh") {
    const refreshed = await _tryRefresh();
    if (refreshed) {
      const retry = await apiFetch(path, options);
      if (!retry.ok) {
        throw new ApiRequestError(`API request failed: ${retry.status}`, retry.status, path);
      }
      return retry.json() as Promise<T>;
    }
  }

  if (!response.ok) {
    throw new ApiRequestError(`API request failed: ${response.status}`, response.status, path);
  }

  return response.json() as Promise<T>;
}
