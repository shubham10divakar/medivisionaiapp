import axios from 'axios';
import type { AxiosInstance } from 'axios';

// ── Wire types (match app/schemas.py on the backend) ─────────────────────────

export interface RemoteModel {
  name: string;
  dataset: string;
  description: string;
  architecture: string;
  task: string; // "multilabel" | "multiclass"
  num_classes: number;
  input_size: number[];
  accuracy?: number | null;
  auc?: number | null;
  parameters?: string | null;
  tags: string[];
  status: string; // "ready" for anything servable
  blockers: string[];
  loaded: boolean;
}

export interface Finding {
  label: string;
  confidence: number; // 0..1
  positive: boolean;
}

export interface PredictionResult {
  threshold: number;
  predictions: Finding[];
  positive_labels: string[];
  // multiclass models (none ready today) return these instead:
  label?: string;
  confidence?: number;
  top_k?: Finding[];
}

export interface PredictionResponse {
  model_name: string;
  dataset: string;
  task: string;
  inference_ms: number;
  result: PredictionResult;
}

export class ApiError extends Error {
  status: number;
  blockers?: string[];
  constructor(status: number, message: string, blockers?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.blockers = blockers;
  }
}

// ── Client ──────────────────────────────────────────────────────────────────

function client(baseURL: string, timeout = 90000): AxiosInstance {
  return axios.create({ baseURL: baseURL.replace(/\/$/, ''), timeout });
}

function toApiError(err: any): ApiError {
  const status: number = err?.response?.status ?? 0;
  const detail = err?.response?.data?.detail;

  if (detail && typeof detail === 'object') {
    return new ApiError(status, detail.message ?? `Request failed (${status})`, detail.blockers);
  }
  if (typeof detail === 'string') return new ApiError(status, detail);

  const fallback: Record<number, string> = {
    0: 'Could not reach the server. Check your connection and the API URL in Settings.',
    409: 'That model is not available for predictions yet.',
    413: 'That image is too large. Keep it under about 12 MB.',
    415: 'Unsupported image type. Use JPEG, PNG, WebP, BMP or TIFF.',
    429: 'Too many requests in a short window. Wait a minute and try again.',
    502: 'The model service is not reachable right now. Try again shortly.',
    503: 'The model service is warming up. Try again in a few seconds.',
    504: 'The model took too long to respond (likely a cold start). Try again.',
  };
  return new ApiError(status, fallback[status] ?? err?.message ?? 'Something went wrong.');
}

/** Ready, servable models. */
export async function fetchModels(apiUrl: string): Promise<RemoteModel[]> {
  try {
    const { data } = await client(apiUrl, 15000).get<RemoteModel[]>('/models');
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw toApiError(err);
  }
}

/** Run one image through a model. */
export async function predict(
  imageUri: string,
  modelName: string,
  threshold: number | null,
  apiUrl: string,
): Promise<PredictionResponse> {
  const form = new FormData();
  form.append('file', { uri: imageUri, name: 'xray.jpg', type: 'image/jpeg' } as any);
  form.append('model_name', modelName);
  if (threshold != null) form.append('threshold', String(threshold));

  try {
    const { data } = await client(apiUrl).post<PredictionResponse>('/predict', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

/**
 * Liveness probe. /health is not exposed through the gateway, so a cheap GET
 * /models doubles as the check — a 200 means the API and a model registry are up.
 */
export async function healthCheck(apiUrl: string): Promise<boolean> {
  try {
    await client(apiUrl, 8000).get('/models');
    return true;
  } catch {
    return false;
  }
}
