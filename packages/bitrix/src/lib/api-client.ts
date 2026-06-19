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

/** Success envelope returned by contract-bound routes (`{ success, data }`). */
interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

/**
 * Get JWT token from backend (used during init, before atoms exist).
 * Maps to the `getToken` route of `BitrixContract`.
 */
export async function getToken(
  baseUrl: string,
  data: Record<string, unknown>,
): Promise<{ token: string }> {
  const res = await request<SuccessEnvelope<{ token: string }>>(
    baseUrl,
    "",
    "POST",
    "/api/getToken",
    data,
  );
  return res.data;
}

/**
 * Post install data to backend (used during app installation).
 * Maps to the `install` route of `BitrixContract`.
 */
export async function postInstall(
  baseUrl: string,
  data: Record<string, unknown>,
): Promise<{ message: string }> {
  const res = await request<SuccessEnvelope<{ message: string }>>(
    baseUrl,
    "",
    "POST",
    "/api/install",
    data,
  );
  return res.data;
}
