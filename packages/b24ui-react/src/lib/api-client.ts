export interface ApiClientOptions {
  baseUrl: string;
  token: string;
}

export interface ApiClient {
  get: <T = unknown>(
    path: string,
    query?: Record<string, string>,
  ) => Promise<T>;
  post: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  put: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  delete: <T = unknown>(path: string) => Promise<T>;
}

async function request<T>(
  baseUrl: string,
  token: string,
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string>,
): Promise<T> {
  let url = `${baseUrl}${path}`;
  if (query) {
    const params = new URLSearchParams(query);
    url += `?${params.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const { baseUrl, token } = options;

  return {
    get: <T = unknown>(path: string, query?: Record<string, string>) =>
      request<T>(baseUrl, token, "GET", path, undefined, query),
    post: <T = unknown>(path: string, body?: unknown) =>
      request<T>(baseUrl, token, "POST", path, body),
    put: <T = unknown>(path: string, body?: unknown) =>
      request<T>(baseUrl, token, "PUT", path, body),
    delete: <T = unknown>(path: string) =>
      request<T>(baseUrl, token, "DELETE", path),
  };
}

/**
 * Get JWT token from backend (used during init, before atoms exist)
 */
export async function getToken(
  baseUrl: string,
  data: Record<string, unknown>,
): Promise<{ token: string }> {
  return request<{ token: string }>(baseUrl, "", "POST", "/api/getToken", data);
}

/**
 * Post install data to backend (used during app installation)
 */
export async function postInstall(
  baseUrl: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    baseUrl,
    "",
    "POST",
    "/api/install",
    data,
  );
}
