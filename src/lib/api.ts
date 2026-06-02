import { getAuthToken } from "@/helpers/cookies";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://uklpkl-production.up.railway.app";

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
  [x: string]: any;
  id: number;
  userId?: number;
  companyId: number;
  cvFile?: string;
  portfolioFile?: string;
  transcriptFile?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | string;
  note?: string;
  createdAt?: string;
  user?: User;
  company?: Company;
}

export interface Student {
  id: number;
  nis: string;
  nama: string;
  kelas: string;
  jurusan: string;
  status_pkl: "Belum Magang" | "Sedang Magang" | "Selesai";
  perusahaan?: string;
}

export interface UserProfile {
  id: number
  name: string
  email: string
  role: string
  gender?: string
  birthPlace?: string
  birthDate?: string
  phone?: string
  address?: string
  createdAt: string
}

// ─── Token Helpers ────────────────────────────────────────────────────────────

export const TOKEN_KEY = "SiMagangku_access_token";

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
  const token = getToken() ?? getAuthToken();
  const body = options.body as any;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const method = options.method || "GET";
  const fullUrl = `${BASE_URL}${path}`;
  
  console.log(`[API] ${method} ${path}`, { 
    headers: Object.keys(headers),
    isFormData,
    hasBody: !!body 
  });

  const res = await fetch(fullUrl, {
    ...options,
    headers,
    body: isFormData ? body : typeof body === "string" ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = { message: `Failed to parse response: ${res.statusText}` };
  }

  console.log(`[API Response] ${method} ${path}`, {
    status: res.status,
    ok: res.ok,
    data: data,
  });

  if (!res.ok) {
    const errMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
    const err = new Error(errMsg);
    (err as any).status = res.status;
    (err as any).data = data;
    console.error(`[API Error] ${method} ${path}:`, err, data);
    throw err;
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

export async function getProfile(): Promise<UserProfile> {
  const res = await request<any>("/users/profile");
  if (res?.data && Array.isArray(res.data)) {
    const token = getToken() ?? getAuthToken();
    const decoded = decodeToken(token!);
    return res.data.find((u: any) => u.id === decoded?.sub) || res.data[0];
  }
  return res?.data || res;
}

export async function updateProfile(payload: Record<string, any>): Promise<any> {
  return request<any>("/users/profile", {
    method: "PATCH",
    body: JSON.stringify(payload), // ← eksplisit stringify
  });
}

// ─── Companies ────────────────────────────────────────────────────────────────

export async function getCompanies(): Promise<Company[]> {
  const res = await request<any>("/companies");
  if (res?.data && Array.isArray(res.data)) {
    return res.data;
  }
  return Array.isArray(res) ? res : [];
}

export async function getCompanyById(id: number): Promise<Company> {
  const res = await request<any>(`/companies/${id}`);
  return res?.data || res;
}

export async function createCompany(payload: {
  name: string;
  address: string;
  field: string;
  description: string;
  quota: number;
  status?: boolean;
}): Promise<Company> {
  const res = await request<any>("/companies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function updateCompany(id: number, payload: Partial<{
  name: string;
  address: string;
  field: string;
  description: string;
  quota: number;
  status: boolean;
}>): Promise<Company> {
  const res = await request<any>(`/companies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function deleteCompany(id: number): Promise<any> {
  const res = await request<any>(`/companies/${id}`, {
    method: "DELETE",
  });
  return res?.deletedData || res?.data || res;
}

export async function deleteApplication(id: number): Promise<void> {
  await request<void>(`/applications/${id}`, {
    method: "DELETE",
  });
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function getApplications(): Promise<Application[]> {
  const res = await request<any>("/applications");
  return Array.isArray(res) ? res : (res.data || []);
}

export async function getStudents(): Promise<Student[]> {
  const res = await request<any>("/users?role=SISWA");
  return Array.isArray(res) ? res : (res.data || []);
}

export async function createStudent(payload: {
  alamat: string;
  nama: string;
  kelas: string;
  jurusan: string;
  status_pkl?: Student["status_pkl"];
  perusahaan?: string;
}): Promise<Student> {
  const res = await request<any>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function updateStudent(id: number, payload: Partial<{
  nis: string;
  nama: string;
  kelas: string;
  jurusan: string;
  status_pkl: Student["status_pkl"];
  perusahaan?: string;
}>): Promise<Student> {
  const res = await request<any>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function deleteStudent(id: number): Promise<void> {
  await request<void>(`/applications/${id}`, {
    method: "DELETE",
  });
}

export async function getMyApplications(): Promise<Application[]> {
  const res = await request<any>(`/applications/my`);
  return Array.isArray(res) ? res : (res.data || []);
}

export async function createApplication(payload: FormData | {
  companyId: number;
  posisi?: string;
  nis?: string;
}): Promise<Application> {
  return request<Application>("/applications", {
    method: "POST",
    body: payload as any,
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
