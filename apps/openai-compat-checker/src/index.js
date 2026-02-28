import axios from "axios";

const DEFAULT_TIMEOUT_MS = 60000;

export function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return "";
  return baseUrl.replace(/\/+$/g, "");
}

export function buildUrl(baseUrl, path) {
  const base = normalizeBaseUrl(baseUrl);
  if (!base) return "";
  if (base.endsWith("/v1")) return `${base}${path}`;
  return `${base}/v1${path}`;
}

export function buildHeaders(token, extraHeaders) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  for (const header of extraHeaders || []) {
    if (!header || !header.key || !header.value) continue;
    headers[header.key] = header.value;
  }
  return headers;
}

export function truncateOutput(value, maxChars) {
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length <= maxChars) return value;
    return value.slice(0, maxChars) + "...";
  }
  try {
    const json = JSON.stringify(value);
    if (json.length <= maxChars) return value;
    return json.slice(0, maxChars) + "...";
  } catch {
    return value;
  }
}

function extractErrorPayload(error) {
  if (!error) return { message: "Unknown error" };
  if (axios.isAxiosError(error)) {
    const status = error.response ? error.response.status : 0;
    const data = error.response ? error.response.data : null;
    return {
      message: error.message,
      status,
      data,
    };
  }
  return { message: String(error) };
}

export async function requestJson({
  baseUrl,
  path,
  method = "GET",
  data,
  token,
  extraHeaders = [],
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const url = buildUrl(baseUrl, path);
  const headers = buildHeaders(token, extraHeaders);
  const start = performance.now();
  try {
    const response = await axios({
      url,
      method,
      data,
      headers,
      timeout: timeoutMs,
    });
    return {
      ok: true,
      status: response.status,
      latencyMs: Math.round(performance.now() - start),
      data: response.data,
    };
  } catch (error) {
    const payload = extractErrorPayload(error);
    return {
      ok: false,
      status: payload.status || 0,
      latencyMs: Math.round(performance.now() - start),
      data: payload.data || null,
      error: payload.message,
    };
  }
}

export async function streamChatCompletion({
  baseUrl,
  body,
  token,
  extraHeaders = [],
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const url = buildUrl(baseUrl, "/chat/completions");
  const headers = {
    ...buildHeaders(token, extraHeaders),
    Accept: "text/event-stream",
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const latencyMs = Math.round(performance.now() - start);
    if (!response.body) {
      return {
        ok: response.ok,
        status: response.status,
        latencyMs,
        firstChunkMs: null,
        text: "",
        bytes: 0,
        error: "No response body for streaming.",
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let firstChunkMs = null;
    let bytes = 0;
    let buffer = "";
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        bytes += value.length;
        if (firstChunkMs === null) {
          firstChunkMs = Math.round(performance.now() - start);
        }
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line || !line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content;
            if (typeof delta === "string") {
              text += delta;
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Math.round(performance.now() - start),
      firstChunkMs,
      text,
      bytes,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      latencyMs: Math.round(performance.now() - start),
      firstChunkMs: null,
      text: "",
      bytes: 0,
      error: String(error?.message || error),
    };
  } finally {
    clearTimeout(timeout);
  }
}
