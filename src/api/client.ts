import type {
  AiCallSummaryResponse,
  AiEmailResponse,
  AiLinkedinResponse,
  AiScoreResponse,
  AiStatus,
  ActivityFeedItem,
  Company,
  Contact,
  CrmSyncStatus,
  Deal,
  DealBoard,
  Note,
  Paginated,
  Pipeline,
  Reminder,
  Task,
} from "@/types";

const API_BASE =
  (typeof window !== "undefined" &&
    (window as any).__ZEUS_API_BASE__) ||
  (import.meta as any).env?.VITE_API_BASE ||
  "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  const data = text ? safeJson(text) : undefined;
  if (!res.ok) {
    throw new ApiError(
      (data as any)?.message || `Request failed (${res.status})`,
      res.status,
      data,
    );
  }
  return data as T;
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

const qs = (params: Record<string, unknown> = {}) => {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : "";
};

// ---------- AI ----------
export const aiApi = {
  status: () => request<AiStatus>(`/ai/status`),
  email: (payload: {
    contact: Partial<Contact>;
    purpose: string;
    tone: string;
    context?: string;
  }) =>
    request<AiEmailResponse>(`/ai/email`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  linkedin: (payload: {
    contact: Partial<Contact>;
    type: "connect" | "dm";
    purpose: string;
    tone: string;
  }) =>
    request<AiLinkedinResponse>(`/ai/linkedin`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  score: (payload: { contactId: string }) =>
    request<AiScoreResponse>(`/ai/score`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  callSummary: (payload: { transcript: string; contactId?: string }) =>
    request<AiCallSummaryResponse>(`/ai/call-summary`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ---------- Companies ----------
export const companiesApi = {
  list: (params?: { q?: string; page?: number; pageSize?: number }) =>
    request<Paginated<Company>>(`/companies${qs(params)}`),
  get: (id: string) => request<Company>(`/companies/${id}`),
  byDomain: (domain: string) =>
    request<Company>(`/companies/by-domain/${encodeURIComponent(domain)}`),
  create: (data: Partial<Company>) =>
    request<Company>(`/companies`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Company>) =>
    request<Company>(`/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`/companies/${id}`, { method: "DELETE" }),
};

// ---------- Contacts ----------
export const contactsApi = {
  list: (params?: { q?: string; page?: number; pageSize?: number; companyId?: string }) =>
    request<Paginated<Contact>>(`/contacts${qs(params)}`),
  get: (id: string) => request<Contact>(`/contacts/${id}`),
  create: (data: Partial<Contact>) =>
    request<Contact>(`/contacts`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Contact>) =>
    request<Contact>(`/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ---------- Pipelines ----------
export const pipelinesApi = {
  list: () => request<Pipeline[]>(`/pipelines`),
  get: (id: string) => request<Pipeline>(`/pipelines/${id}`),
};

// ---------- Deals ----------
export const dealsApi = {
  board: (pipelineId?: string) =>
    request<DealBoard>(`/deals/board${qs({ pipelineId })}`),
  list: () => request<Deal[]>(`/deals`),
  get: (id: string) => request<Deal>(`/deals/${id}`),
  create: (data: Partial<Deal>) =>
    request<Deal>(`/deals`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Deal>) =>
    request<Deal>(`/deals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  move: (
    id: string,
    payload: { stageId: string; position: number },
  ) =>
    request<Deal>(`/deals/${id}/move`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  won: (id: string) => request<Deal>(`/deals/${id}/won`, { method: "POST" }),
  lost: (id: string) => request<Deal>(`/deals/${id}/lost`, { method: "POST" }),
};

// ---------- Activity ----------
export const activityApi = {
  feed: (params?: {
    contactId?: string;
    companyId?: string;
    dealId?: string;
    types?: string;
    since?: string;
  }) => request<ActivityFeedItem[]>(`/activity${qs(params)}`),
  notes: {
    list: (params: { contactId?: string; companyId?: string; dealId?: string }) =>
      request<Note[]>(`/activity/notes${qs(params)}`),
    create: (data: Partial<Note>) =>
      request<Note>(`/activity/notes`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      request<void>(`/activity/notes/${id}`, { method: "DELETE" }),
  },
};

// ---------- Tasks ----------
export const tasksApi = {
  list: (filter?: "today" | "overdue" | "week" | "all") =>
    request<Task[]>(`/tasks${qs({ filter })}`),
  create: (data: Partial<Task>) =>
    request<Task>(`/tasks`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  complete: (id: string) =>
    request<Task>(`/tasks/${id}/complete`, { method: "POST" }),
  reopen: (id: string) =>
    request<Task>(`/tasks/${id}/reopen`, { method: "POST" }),
  remove: (id: string) =>
    request<void>(`/tasks/${id}`, { method: "DELETE" }),
};

// ---------- Reminders ----------
export const remindersApi = {
  list: (ownerId?: string) =>
    request<Reminder[]>(`/reminders${qs({ ownerId })}`),
  schedule: (data: Partial<Reminder>) =>
    request<Reminder>(`/reminders`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  cancel: (id: string) =>
    request<void>(`/reminders/${id}`, { method: "DELETE" }),
};

// ---------- CRM Sync ----------
export const crmSyncApi = {
  status: () => request<CrmSyncStatus[]>(`/crm-sync/status`),
  pull: (provider: string) =>
    request<{ ok: true }>(`/crm-sync/${provider}/pull`, { method: "POST" }),
  push: (provider: string, entity: string) =>
    request<{ ok: true }>(`/crm-sync/${provider}/push/${entity}`, {
      method: "POST",
    }),
};
