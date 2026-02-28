import React, { useEffect, useMemo, useState } from "react";
import {
  useLocalStorageState,
  useRequest,
  useUpdateEffect,
  useMemoizedFn,
} from "ahooks";
import { requestJson, streamChatCompletion, truncateOutput } from "./index.js";

const DEFAULT_TESTS = ["text", "tools", "cli", "image"];
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_MAX_OUTPUT_CHARS = 2000;

const TEST_LABELS = {
  text: "Text",
  tools: "Tools",
  cli: "CLI Stream",
  image: "Image",
};

const TEST_DESCRIPTIONS = {
  text: "POST /v1/chat/completions",
  tools: "Tool-call response",
  cli: "Streaming chat completion",
  image: "POST /v1/images/generations",
};

function normalizeHeaderRows(headers) {
  const cleaned = headers
    .map((row) => ({
      key: (row.key || "").trim(),
      value: (row.value || "").trim(),
    }))
    .filter((row) => row.key && row.value);

  return cleaned;
}

function modelId(entry) {
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  if (typeof entry.id === "string") return entry.id;
  return "";
}

function normalizeModalities(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).toLowerCase());
  if (typeof value === "string") return [value.toLowerCase()];
  return [];
}

function inferModelTags(entry) {
  const tags = new Set();
  const id = modelId(entry).toLowerCase();
  const modalities = normalizeModalities(
    entry?.modalities ||
      entry?.capabilities?.modalities ||
      entry?.input_modalities ||
      entry?.output_modalities
  );

  if (modalities.includes("text")) tags.add("text");
  if (modalities.includes("image")) tags.add("image");

  const capabilities = entry?.capabilities || {};
  const toolSupport =
    capabilities.tools ||
    capabilities.tool_calling ||
    entry?.supports_tools ||
    entry?.supports_function_calling ||
    entry?.tool_calling ||
    entry?.function_call;

  if (toolSupport) tags.add("tool");

  if (!tags.has("text")) {
    if (
      capabilities.chat_completion ||
      capabilities.completion ||
      id.includes("gpt") ||
      id.includes("chat") ||
      id.includes("llama") ||
      id.includes("qwen") ||
      id.includes("claude")
    ) {
      tags.add("text");
    }
  }

  if (!tags.has("image")) {
    if (
      capabilities.vision ||
      capabilities.image ||
      id.includes("vision") ||
      id.includes("image") ||
      id.includes("dall") ||
      id.includes("flux")
    ) {
      tags.add("image");
    }
  }

  if (tags.size === 0) tags.add("unknown");
  return Array.from(tags);
}

function formatModelLabel(entry) {
  const id = modelId(entry);
  const tags = inferModelTags(entry);
  if (!id) return "";
  return `${id} · ${tags.join(", ")}`;
}

function formatDuration(ms) {
  if (ms == null) return "-";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function statusBadge(ok) {
  return ok ? "Pass" : "Fail";
}

export default function App() {
  const [baseUrl, setBaseUrl] = useLocalStorageState("occ.baseUrl", {
    defaultValue: "",
  });
  const [token, setToken] = useLocalStorageState("occ.token", {
    defaultValue: "",
  });
  const [timeoutMs, setTimeoutMs] = useLocalStorageState("occ.timeoutMs", {
    defaultValue: DEFAULT_TIMEOUT_MS,
  });
  const [maxOutputChars, setMaxOutputChars] = useLocalStorageState(
    "occ.maxOutputChars",
    { defaultValue: DEFAULT_MAX_OUTPUT_CHARS }
  );

  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [models, setModels] = useState([]);
  const [modelsMeta, setModelsMeta] = useState(null);
  const [modelError, setModelError] = useState(null);

  const [selectedModel, setSelectedModel] = useLocalStorageState("occ.model", {
    defaultValue: "",
  });
  const [selectedImageModel, setSelectedImageModel] = useLocalStorageState(
    "occ.imageModel",
    { defaultValue: "" }
  );

  const [selectedTests, setSelectedTests] = useLocalStorageState("occ.tests", {
    defaultValue: DEFAULT_TESTS,
  });

  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [activeTest, setActiveTest] = useState(null);

  const extraHeaders = useMemo(
    () => normalizeHeaderRows(headers),
    [headers]
  );

  const modelOptions = useMemo(
    () => models.map(modelId).filter(Boolean),
    [models]
  );

  const modelEntries = useMemo(
    () =>
      models
        .map((entry) => ({
          id: modelId(entry),
          label: formatModelLabel(entry),
          tags: inferModelTags(entry),
        }))
        .filter((entry) => entry.id),
    [models]
  );

  useUpdateEffect(() => {
    if (!modelOptions.length) return;
    if (!selectedModel || !modelOptions.includes(selectedModel)) {
      setSelectedModel(modelOptions[0]);
    }
    if (!selectedImageModel || !modelOptions.includes(selectedImageModel)) {
      setSelectedImageModel(modelOptions[0]);
    }
  }, [modelOptions.join("|")]);

  const loadModels = useMemoizedFn(async () => {
    if (!baseUrl) {
      setModelError("Please provide a base URL.");
      return;
    }

    setModelError(null);
    const response = await requestJson({
      baseUrl,
      path: "/models",
      token,
      extraHeaders,
      timeoutMs,
    });

    const data = response.data?.data || [];
    setModels(Array.isArray(data) ? data : []);
    setModelsMeta({
      ok: response.ok,
      status: response.status,
      latencyMs: response.latencyMs,
      count: Array.isArray(data) ? data.length : 0,
    });

    if (!response.ok) {
      setModelError(
        response.error ||
          (response.data && JSON.stringify(response.data)) ||
          "Failed to load models."
      );
    }
  });

  const { runAsync: runLoadModels, loading: modelsLoading } = useRequest(
    loadModels,
    { manual: true }
  );

  useEffect(() => {
    setModels([]);
    setModelsMeta(null);
    setModelError(null);
  }, [baseUrl]);

  const toggleTest = (test) => {
    setSelectedTests((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      if (safePrev.includes(test)) {
        return safePrev.filter((item) => item !== test);
      }
      return [...safePrev, test];
    });
  };

  const updateHeaderRow = (index, field, value) => {
    setHeaders((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const addHeaderRow = () => {
    setHeaders((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeHeaderRow = (index) => {
    setHeaders((prev) => prev.filter((_, idx) => idx !== index));
  };

  const runSingleTest = async (name) => {
    const common = {
      baseUrl,
      token,
      extraHeaders,
      timeoutMs,
    };

    if (name === "text") {
      const body = {
        model: selectedModel,
        messages: [
          {
            role: "user",
            content: "Reply with a short sentence confirming text test.",
          },
        ],
        temperature: 0.2,
        max_tokens: 64,
      };
      const response = await requestJson({
        ...common,
        path: "/chat/completions",
        method: "POST",
        data: body,
      });
      return {
        name,
        model: selectedModel,
        ok: response.ok,
        status: response.status,
        latencyMs: response.latencyMs,
        response: truncateOutput(response.data, maxOutputChars),
        error: response.error || null,
      };
    }

    if (name === "tools") {
      const body = {
        model: selectedModel,
        messages: [{ role: "user", content: "Call the get_time tool." }],
        tools: [
          {
            type: "function",
            function: {
              name: "get_time",
              description: "Return the current time in ISO format.",
              parameters: {
                type: "object",
                properties: {},
              },
            },
          },
        ],
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: 64,
      };
      const response = await requestJson({
        ...common,
        path: "/chat/completions",
        method: "POST",
        data: body,
      });
      return {
        name,
        model: selectedModel,
        ok: response.ok,
        status: response.status,
        latencyMs: response.latencyMs,
        response: truncateOutput(response.data, maxOutputChars),
        error: response.error || null,
      };
    }

    if (name === "cli") {
      const body = {
        model: selectedModel,
        messages: [{ role: "user", content: "Stream a short reply for CLI test." }],
        temperature: 0.2,
        max_tokens: 64,
        stream: true,
      };
      const response = await streamChatCompletion({
        ...common,
        body,
      });
      return {
        name,
        model: selectedModel,
        ok: response.ok,
        status: response.status,
        latencyMs: response.latencyMs,
        firstChunkMs: response.firstChunkMs,
        bytes: response.bytes,
        response: truncateOutput(response.text, maxOutputChars),
        error: response.error || null,
      };
    }

    if (name === "image") {
      const body = {
        model: selectedImageModel || selectedModel,
        prompt: "A simple red square on a white background.",
        size: "512x512",
        n: 1,
        response_format: "b64_json",
      };
      const response = await requestJson({
        ...common,
        path: "/images/generations",
        method: "POST",
        data: body,
      });
      return {
        name,
        model: selectedImageModel || selectedModel,
        ok: response.ok,
        status: response.status,
        latencyMs: response.latencyMs,
        response: truncateOutput(response.data, maxOutputChars),
        error: response.error || null,
      };
    }

    return {
      name,
      ok: false,
      status: 0,
      latencyMs: null,
      response: null,
      error: `Unknown test: ${name}`,
    };
  };

  const runTests = async () => {
    if (!baseUrl) {
      setResults([
        {
          name: "setup",
          ok: false,
          status: 0,
          latencyMs: null,
          response: null,
          error: "Base URL is required.",
        },
      ]);
      return;
    }
    if (!selectedModel) {
      setResults([
        {
          name: "setup",
          ok: false,
          status: 0,
          latencyMs: null,
          response: null,
          error: "Pick a model or fetch models first.",
        },
      ]);
      return;
    }

    setRunning(true);
    setResults([]);

    const testsToRun = Array.isArray(selectedTests) ? selectedTests : [];
    if (testsToRun.length === 0) {
      setResults([
        {
          name: "setup",
          ok: false,
          status: 0,
          latencyMs: null,
          response: null,
          error: "Select at least one test.",
        },
      ]);
      setRunning(false);
      return;
    }

    for (const test of testsToRun) {
      setActiveTest(test);
      const result = await runSingleTest(test);
      setResults((prev) => [...prev, result]);
    }

    setActiveTest(null);
    setRunning(false);
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">OpenAI Compatibility Lab</p>
          <h1>Endpoint Health & Capability Probe</h1>
          <p className="subtitle">
            Validate OpenAI-compatible endpoints with structured checks for
            models, text, tools, streaming CLI, and images.
          </p>
        </div>
        <div className="hero-card">
          <div className="hero-metric">
            <span>Models</span>
            <strong>
              {modelsMeta?.count != null ? modelsMeta.count : "-"}
            </strong>
          </div>
          <div className="hero-metric">
            <span>Latency</span>
            <strong>
              {modelsMeta?.latencyMs != null
                ? formatDuration(modelsMeta.latencyMs)
                : "-"}
            </strong>
          </div>
          <div className="hero-metric">
            <span>Status</span>
            <strong>{modelsMeta ? statusBadge(modelsMeta.ok) : "-"}</strong>
          </div>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Connection</h2>
          <p>Provide base URL, token, and any required headers.</p>
        </div>
        <div className="grid two">
          <label className="field">
            <span>Base URL</span>
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://api.example.com"
            />
          </label>
          <label className="field">
            <span>Token</span>
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="sk-..."
              type="password"
            />
          </label>
          <label className="field">
            <span>Timeout (ms)</span>
            <input
              value={timeoutMs}
              onChange={(event) => {
                const value = Number(event.target.value);
                setTimeoutMs(Number.isFinite(value) ? value : DEFAULT_TIMEOUT_MS);
              }}
              type="number"
              min="1000"
              step="1000"
            />
          </label>
          <label className="field">
            <span>Max Output Chars</span>
            <input
              value={maxOutputChars}
              onChange={(event) => {
                const value = Number(event.target.value);
                setMaxOutputChars(
                  Number.isFinite(value) ? value : DEFAULT_MAX_OUTPUT_CHARS
                );
              }}
              type="number"
              min="200"
              step="200"
            />
          </label>
        </div>

        <div className="subsection">
          <div className="subsection-header">
            <h3>Extra Headers</h3>
            <button type="button" className="ghost" onClick={addHeaderRow}>
              Add Header
            </button>
          </div>
          {headers.map((row, index) => (
            <div className="header-row" key={`header-${index}`}>
              <input
                placeholder="Header name"
                value={row.key}
                onChange={(event) =>
                  updateHeaderRow(index, "key", event.target.value)
                }
              />
              <input
                placeholder="Header value"
                value={row.value}
                onChange={(event) =>
                  updateHeaderRow(index, "value", event.target.value)
                }
              />
              <button
                type="button"
                className="ghost danger"
                onClick={() => removeHeaderRow(index)}
                disabled={headers.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="actions">
          <button
            type="button"
            className="primary"
            onClick={runLoadModels}
            disabled={modelsLoading}
          >
            {modelsLoading ? "Loading..." : "Fetch Models"}
          </button>
          {modelError ? <span className="error">{modelError}</span> : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Models & Tests</h2>
          <p>Pick your primary model and targeted checks.</p>
        </div>

        <div className="grid two">
          <label className="field">
            <span>Text/Tools/CLI Model</span>
            <select
              value={selectedModel || ""}
              onChange={(event) => setSelectedModel(event.target.value)}
            >
              <option value="">Select a model</option>
              {modelEntries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Image Model</span>
            <select
              value={selectedImageModel || ""}
              onChange={(event) => setSelectedImageModel(event.target.value)}
            >
              <option value="">Fallback to primary model</option>
              {modelEntries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="model-list">
          {modelEntries.length === 0 ? (
            <span className="hint">No models loaded yet.</span>
          ) : (
            modelEntries.map((entry) => (
              <div className="model-chip" key={`model-${entry.id}`}>
                <span>{entry.id}</span>
                <div className="tag-row">
                  {entry.tags.map((tag) => (
                    <span className={`tag ${tag}`} key={`${entry.id}-${tag}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="test-grid">
          {DEFAULT_TESTS.map((test) => (
            <button
              key={test}
              type="button"
              className={`test-tile ${
                selectedTests.includes(test) ? "active" : ""
              }`}
              onClick={() => toggleTest(test)}
            >
              <div>
                <strong>{TEST_LABELS[test]}</strong>
                <span>{TEST_DESCRIPTIONS[test]}</span>
              </div>
              <div className="pill">
                {selectedTests.includes(test) ? "Selected" : "Off"}
              </div>
            </button>
          ))}
        </div>

        <div className="actions">
          <button
            type="button"
            className="primary"
            onClick={runTests}
            disabled={running}
          >
            {running ? `Running ${activeTest || "tests"}...` : "Run Tests"}
          </button>
          <span className="hint">
            Streaming test requires SSE support on the API endpoint.
          </span>
        </div>
      </section>

      <section className="panel results">
        <div className="panel-header">
          <h2>Results</h2>
          <p>Latency, status, and response preview for each check.</p>
        </div>

        {results.length === 0 ? (
          <div className="empty">No results yet. Run a test suite.</div>
        ) : (
          <div className="results-grid">
            {results.map((result, index) => (
              <article className="result-card" key={`${result.name}-${index}`}>
                <header>
                  <div>
                    <h3>{TEST_LABELS[result.name] || result.name}</h3>
                    <p>{result.model || "-"}</p>
                  </div>
                  <span className={`badge ${result.ok ? "ok" : "fail"}`}>
                    {statusBadge(result.ok)}
                  </span>
                </header>
                <div className="result-meta">
                  <div>
                    <span>Status</span>
                    <strong>{result.status}</strong>
                  </div>
                  <div>
                    <span>Latency</span>
                    <strong>{formatDuration(result.latencyMs)}</strong>
                  </div>
                  {result.firstChunkMs != null ? (
                    <div>
                      <span>First Chunk</span>
                      <strong>{formatDuration(result.firstChunkMs)}</strong>
                    </div>
                  ) : null}
                  {result.bytes != null ? (
                    <div>
                      <span>Bytes</span>
                      <strong>{result.bytes}</strong>
                    </div>
                  ) : null}
                </div>
                {result.error ? (
                  <div className="error-block">{result.error}</div>
                ) : null}
                <pre className="response-preview">
{typeof result.response === "string"
  ? result.response
  : JSON.stringify(result.response, null, 2)}
                </pre>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="footer">
        <p>
          If you see CORS errors in the browser console, proxy requests or run
          this UI from the same domain as the API.
        </p>
      </footer>
    </div>
  );
}
