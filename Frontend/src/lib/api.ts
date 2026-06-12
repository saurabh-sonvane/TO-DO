import type {
  User,
  AuthResponse,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  DashboardStats,
  UserDetail,
  ActivityLog,
} from "@/types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data: T;
  pagination?: unknown;
}

interface TaskEnvelope {
  task: Task;
}

interface UserEnvelope {
  user: User;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: unknown;
}

class ApiClient {
  private isValidToken(token: unknown): token is string {
    return (
      typeof token === "string" &&
      token.length > 0 &&
      token !== "undefined" &&
      token !== "null" &&
      token !== "[object Object]"
    );
  }

  private getAccessToken(): string | null {
    const accessToken = localStorage.getItem("accessToken");
    if (!this.isValidToken(accessToken)) {
      this.clearTokens();
      return null;
    }
    return accessToken;
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    if (!this.isValidToken(accessToken) || !this.isValidToken(refreshToken)) {
      this.clearTokens();
      throw new Error("Invalid authentication response");
    }
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!this.isValidToken(refreshToken)) {
      this.clearTokens();
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const payload = (await response.json()) as ApiEnvelope<AuthResponse>;
      const data = this.unwrapResponse<AuthResponse>(payload);
      this.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  async request<T>(
    endpoint: string,
    method: HttpMethod = "GET",
    body?: unknown,
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const accessToken = this.getAccessToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    let response = await fetch(url, config);

    if (response.status === 401 && accessToken) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        response = await fetch(url, { ...config, headers });
      } else {
        throw new Error("Authentication expired");
      }
    }

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ message: "Request failed" }))) as { message?: string };
      throw new Error(error.message || `HTTP error ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const payload = (await response.json()) as ApiEnvelope<T>;
    return this.unwrapResponse<T>(payload);
  }

  private unwrapResponse<T>(payload: T | ApiEnvelope<T>): T {
    if (payload !== null && typeof payload === "object" && "data" in payload) {
      return (payload as ApiEnvelope<T>).data;
    }
    return payload as T;
  }

  setAuthTokens(accessToken: string, refreshToken: string): void {
    this.setTokens(accessToken, refreshToken);
  }

  clearAuth(): void {
    this.clearTokens();
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", "POST", {
      email,
      password,
    });
  }

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", "POST", {
      name,
      email,
      password,
    });
  }

  async logout(): Promise<void> {
    return this.request("/auth/logout", "POST");
  }

  async getMe(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  async updateMe(data: { name?: string; avatar?: string }): Promise<User> {
    const res = await this.request<UserEnvelope | User>(
      "/auth/me",
      "PATCH",
      data,
    );
    return (res as UserEnvelope).user ?? (res as User);
  }

  // ─── User Tasks ───────────────────────────────────────────────────────────
  async getTasks(params?: {
    status?: string;
    priority?: string;
  }): Promise<Task[]> {
    const query = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    const res = await this.request<PaginatedResponse<Task> | Task[]>(
      `/tasks${query ? `?${query}` : ""}`,
    );
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<Task>).data ?? [];
  }

  async getTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`);
  }

  async createTask(task: CreateTaskInput): Promise<Task> {
    const res = await this.request<TaskEnvelope | Task>("/tasks", "POST", task);
    return (res as TaskEnvelope).task ?? (res as Task);
  }

  async updateTask(id: string, task: UpdateTaskInput): Promise<Task> {
    const res = await this.request<TaskEnvelope | Task>(
      `/tasks/${id}`,
      "PATCH",
      task,
    );
    return (res as TaskEnvelope).task ?? (res as Task);
  }

  async deleteTask(id: string): Promise<void> {
    return this.request(`/tasks/${id}`, "DELETE");
  }

  // ─── Admin ────────────────────────────────────────────────────────────────
  async getAdminDashboard(): Promise<DashboardStats> {
    return this.request<DashboardStats>("/admin/dashboard");
  }

  async getAdminEnums(): Promise<{
    roles: string[];
    statuses: string[];
    taskStatuses: string[];
    priorities: string[];
  }> {
    return this.request("/admin/enums");
  }

  async getAdminUsers(params?: {
    status?: string;
    role?: string;
  }): Promise<User[]> {
    const query = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    const res = await this.request<PaginatedResponse<User> | User[]>(
      `/admin/users${query ? `?${query}` : ""}`,
    );
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<User>).data ?? [];
  }

  async getAdminUser(id: string): Promise<UserDetail> {
    return this.request<UserDetail>(`/admin/users/${id}`);
  }

  async updateUserStatus(
    id: string,
    status: "active" | "inactive",
  ): Promise<User> {
    const res = await this.request<UserEnvelope | User>(
      `/admin/users/${id}/status`,
      "PATCH",
      { status },
    );
    return (res as UserEnvelope).user ?? (res as User);
  }

  async updateUserRole(id: string, role: "user" | "admin"): Promise<User> {
    const res = await this.request<UserEnvelope | User>(
      `/admin/users/${id}/role`,
      "PATCH",
      { role },
    );
    return (res as UserEnvelope).user ?? (res as User);
  }

  async deleteUser(id: string): Promise<void> {
    return this.request(`/admin/users/${id}`, "DELETE");
  }

  async getAdminTasks(params?: {
    status?: string;
    userId?: string;
  }): Promise<Task[]> {
    const query = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    const res = await this.request<PaginatedResponse<Task> | Task[]>(
      `/admin/tasks${query ? `?${query}` : ""}`,
    );
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<Task>).data ?? [];
  }

  async deleteAdminTask(id: string): Promise<void> {
    return this.request(`/admin/tasks/${id}`, "DELETE");
  }

  async getActivityLogs(params?: { userId?: string }): Promise<ActivityLog[]> {
    const query = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    const res = await this.request<
      PaginatedResponse<ActivityLog> | ActivityLog[]
    >(`/admin/logs${query ? `?${query}` : ""}`);
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<ActivityLog>).data ?? [];
  }
}

export const api = new ApiClient();
