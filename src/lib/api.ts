const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://uklpkl-production.up.railway.app";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthRegisterResponse {
  message: string;
  data: User;
}

export interface AuthLoginResponse {
  message: string;
  access_token: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: "SISWA" | "ADMIN";
  iat: number;
  exp: number;
}

export interface Company {
  id: number;
  name: string;
  address: string;
  field: string;
  description: string;
  quota: number;
  status: boolean;
}

export interface Application {
  id: number;
  companyId: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  note?: string;
}

// ─── Token Helpers ────────────────────────────────────────────────────────────

export const TOKEN_KEY = "sitp_access_token";

export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/** Decode the JWT payload WITHOUT verifying the signature (client-side only). */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Request Helper ───────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data?.message || `Request failed with status ${res.status}`
    );
  }

  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function register(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthRegisterResponse> {
  return request<AuthRegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<AuthLoginResponse> {
  return request<AuthLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getProfile(): Promise<User> {
  return request<User>("/auth/profile");
}

// ─── Companies ────────────────────────────────────────────────────────────────

export async function getCompanies(): Promise<Company[]> {
  const res = await request<any>("/companies");
  return Array.isArray(res) ? res : (res.data || []);
}

export async function getCompanyById(id: number): Promise<Company> {
  const res = await request<any>(`/companies/${id}`);
  return res.data || res;
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function getApplications(): Promise<Application[]> {
  const res = await request<any>("/applications");
  return Array.isArray(res) ? res : (res.data || []);
}

export async function createApplication(payload: {
  companyId: number;
}): Promise<Application> {
  return request<Application>("/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateApplicationStatus(
  id: number,
  payload: { status: "ACCEPTED" | "REJECTED"; note?: string }
): Promise<Application> {
  return request<Application>(`/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
