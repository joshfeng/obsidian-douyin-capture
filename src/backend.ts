import { requestUrl } from "obsidian";
import type {
  DouyinPluginSettings,
  ExtractResponse,
} from "./settings";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export async function checkHealth(
  serverUrl: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const resp = await requestUrl({
      url: `${normalizeBaseUrl(serverUrl)}/api/health`,
      method: "GET",
    });

    if (resp.status !== 200) {
      return { ok: false, status: resp.status };
    }

    const data = JSON.parse(resp.text) as { success?: boolean };
    return { ok: data.success === true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export type ExtractMode = "full" | "video_only";

export async function extractContent(
  settings: DouyinPluginSettings,
  shareUrl: string,
  mode: ExtractMode = "full"
): Promise<ExtractResponse> {
  const base = normalizeBaseUrl(settings.serverUrl);

  const resp = await requestUrl({
    url: `${base}/api/video/extract`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: shareUrl,
      model: settings.whisperModel,
      skip_transcribe: mode === "video_only",
      mode: mode === "video_only" ? "video_only" : "full",
    }),
  });

  let data: ExtractResponse;
  try {
    data = JSON.parse(resp.text) as ExtractResponse;
  } catch {
    throw new Error("INVALID_JSON");
  }

  if (resp.status >= 400 || !data.success) {
    const err = !data.success ? data.error : `HTTP ${resp.status}`;
    return { success: false, error: err };
  }

  return data;
}
