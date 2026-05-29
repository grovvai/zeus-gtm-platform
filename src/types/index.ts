// Domain types matching backend models

export type Tier = "hot" | "warm" | "cool" | "cold";
export type DealStatus = "open" | "won" | "lost";
export type Sentiment = "positive" | "neutral" | "negative";

export interface Company {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  website?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  companyId?: string | null;
  company?: Company | null;
  linkedinUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  probability: number;
  isWon?: boolean;
  isLost?: boolean;
  pipelineId: string;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
}

export interface Deal {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  stageId: string;
  pipelineId: string;
  companyId?: string | null;
  contactId?: string | null;
  contact?: Contact | null;
  company?: Company | null;
  position: number;
  status: DealStatus;
  probability?: number;
  closeDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardStage extends PipelineStage {
  deals: Deal[];
  total: number;
}

export interface DealBoard {
  pipeline: Pipeline;
  stages: BoardStage[];
}

export interface Note {
  id: string;
  body: string;
  authorId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  createdAt: string;
}

export type ActivityType =
  | "email"
  | "linkedin"
  | "task"
  | "stage_change"
  | "note";

export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  subtype?: string;
  title: string;
  description?: string;
  meta?: Record<string, unknown>;
  occurredAt: string;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  ownerId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  priority?: "low" | "med" | "high";
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  remindAt: string;
  ownerId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  jobId?: string;
  status?: "scheduled" | "fired" | "cancelled";
}

export interface AiStatus {
  enabled: boolean;
  model?: string;
  reason?: string;
}

export interface AiEmailResponse {
  subject: string;
  body: string;
  wordCount: number;
}

export interface AiLinkedinResponse {
  type: "connect" | "dm";
  message: string;
  charCount: number;
}

export interface AiScoreResponse {
  score: number;
  tier: Tier;
  signals: string[];
  reasoning: string;
  recommendedAction: string;
}

export interface AiCallSummaryResponse {
  summary: string;
  keyPoints: string[];
  objections: string[];
  nextSteps: string[];
  sentiment: Sentiment;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CrmSyncStatus {
  provider: string;
  connected: boolean;
  lastSyncAt?: string | null;
  lastError?: string | null;
}
