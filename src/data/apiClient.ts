import { SERVER_URL, SERVER_TIMEOUT_MS, SERVER_API_KEY } from './apiConfig';
import { encryptUserEmail } from './userToken';

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

const baseHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { 'X-API-Key': SERVER_API_KEY };
  const token = await encryptUserEmail();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

async function get<T>(path: string): Promise<T> {
  const res = await fetchWithTimeout(`${SERVER_URL}${path}`, {
    headers: await baseHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: GET ${path}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithTimeout(`${SERVER_URL}${path}`, {
    method: 'POST',
    headers: { ...await baseHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: POST ${path}`);
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithTimeout(`${SERVER_URL}${path}`, {
    method: 'PATCH',
    headers: { ...await baseHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: PATCH ${path}`);
  return res.json() as Promise<T>;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithTimeout(`${SERVER_URL}${path}`, {
    method: 'PUT',
    headers: { ...await baseHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: PUT ${path}`);
  return res.json() as Promise<T>;
}

async function del(path: string): Promise<void> {
  const res = await fetchWithTimeout(`${SERVER_URL}${path}`, {
    method: 'DELETE',
    headers: await baseHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}: DELETE ${path}`);
}

export const api = { get, post, put, patch, delete: del };

export async function serverRead<T>(fetcher: () => Promise<T>, label: string): Promise<T | null> {
  try {
    const result = await fetcher();
    console.log(`[SERVER] ${label} ✓`);
    return result;
  } catch (err) {
    console.warn(`[SERVER] ${label} ✗ - fallback to Firebase`, err);
    return null;
  }
}

export function serverWrite(writer: () => Promise<unknown>, label: string): void {
  writer()
    .then(() => console.log(`[SERVER] ${label} ✓`))
    .catch((err) => console.warn(`[SERVER] ${label} ✗`, err));
}
