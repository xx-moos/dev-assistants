import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const LANG_OPTIONS = [
  { value: "zh-CN", label: "中文（简体）" },
  { value: "en", label: "英文" },
];

const PRESETS = [
  "用户订单统计",
  "商品详情页首屏渲染",
  "批量导出报表任务",
  "实时消息连接状态",
];

const decodeHtml = (text) => {
  if (!text) return "";
  const parser = new DOMParser();
  return parser.parseFromString(text, "text/html").documentElement.textContent;
};

const splitWords = (text) =>
  (text || "")
    .replace(/[_-]+/g, " ")
    .split(/[\s,.;:!?，。！？；、/|]+/)
    .map((part) => part.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .map((part) => part.toLowerCase());

const upperFirst = (word) =>
  word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : "";

const toCamelCase = (words) =>
  words.length === 0
    ? ""
    : `${words[0]}${words
        .slice(1)
        .map((word) => upperFirst(word))
        .join("")}`;

const toPascalCase = (words) => words.map((word) => upperFirst(word)).join("");
const toSnakeCase = (words) => words.join("_");
const toUpperSnakeCase = (words) => words.join("_").toUpperCase();
const toKebabCase = (words) => words.join("-");
const toDotCase = (words) => words.join(".");

const ensureValidIdentifier = (value, { prefix = "v" } = {}) => {
  if (!value) return prefix;
  if (/^[a-zA-Z_$]/.test(value)) return value;
  return `${prefix}_${value}`;
};

const buildNameRows = (words) => {
  const camel = ensureValidIdentifier(toCamelCase(words), { prefix: "v" });
  const pascal = ensureValidIdentifier(toPascalCase(words), { prefix: "Type" });
  const snake = ensureValidIdentifier(toSnakeCase(words), { prefix: "v" });
  const upperSnake = ensureValidIdentifier(toUpperSnakeCase(words), {
    prefix: "CONST",
  });
  const kebab = toKebabCase(words) || "name-placeholder";
  const dot = toDotCase(words) || "name.placeholder";

  return [
    {
      id: "jsVar",
      language: "JavaScript / TypeScript",
      rule: "变量（camelCase）",
      value: camel,
    },
    {
      id: "jsConst",
      language: "JavaScript / TypeScript",
      rule: "常量（UPPER_SNAKE_CASE）",
      value: upperSnake,
    },
    {
      id: "javaVar",
      language: "Java / Kotlin",
      rule: "字段（camelCase）",
      value: camel,
    },
    {
      id: "javaType",
      language: "Java / Kotlin",
      rule: "类型（PascalCase）",
      value: pascal,
    },
    {
      id: "pyVar",
      language: "Python",
      rule: "变量（snake_case）",
      value: snake,
    },
    {
      id: "pyConst",
      language: "Python",
      rule: "常量（UPPER_SNAKE_CASE）",
      value: upperSnake,
    },
    {
      id: "goPrivate",
      language: "Go",
      rule: "包内变量（camelCase）",
      value: camel,
    },
    {
      id: "goExport",
      language: "Go",
      rule: "导出变量（PascalCase）",
      value: pascal,
    },
    {
      id: "csharpField",
      language: "C#",
      rule: "私有字段（_camelCase）",
      value: `_${camel}`,
    },
    {
      id: "csharpProp",
      language: "C#",
      rule: "属性（PascalCase）",
      value: pascal,
    },
    {
      id: "phpVar",
      language: "PHP",
      rule: "变量（$camelCase）",
      value: `$${camel}`,
    },
    {
      id: "rustVar",
      language: "Rust",
      rule: "变量（snake_case）",
      value: snake,
    },
    {
      id: "sqlCol",
      language: "SQL",
      rule: "字段名（snake_case）",
      value: snake,
    },
    {
      id: "cssClass",
      language: "CSS",
      rule: "类名（kebab-case）",
      value: kebab,
    },
    {
      id: "shellVar",
      language: "Shell",
      rule: "环境变量（UPPER_SNAKE_CASE）",
      value: upperSnake,
    },
    {
      id: "fileName",
      language: "文件系统",
      rule: "文件名（kebab-case）",
      value: kebab,
    },
    {
      id: "dotName",
      language: "通用配置",
      rule: "点分命名（dot.case）",
      value: dot,
    },
  ];
};

const TranslationNaming = () => {
  const [serviceMode, setServiceMode] = useState("public");
  const [apiKey, setApiKey] = useState("");
  const [sourceLang, setSourceLang] = useState("zh-CN");
  const [targetLang, setTargetLang] = useState("en");
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [detectedSource, setDetectedSource] = useState("");
  const [selectedWords, setSelectedWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  const words = useMemo(() => splitWords(translatedText), [translatedText]);
  const activeWords = useMemo(
    () => (selectedWords.length > 0 ? selectedWords : words),
    [selectedWords, words],
  );
  const rows = useMemo(() => buildNameRows(activeWords), [activeWords]);

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setHint(`已复制：${value}`);
    } catch {
      setHint("复制失败：浏览器未授权剪贴板");
    }
  };

  const toggleWord = (word) => {
    setSelectedWords((prev) =>
      prev.includes(word)
        ? prev.filter((item) => item !== word)
        : [...prev, word],
    );
  };

  const selectPreset = (value) => {
    setText(value);
    setError("");
    setHint("");
  };

  const translateWithPublicApi = async () => {
    const sl = sourceLang || "auto";
    const tl = targetLang || "en";
    const params = new URLSearchParams({
      client: "gtx",
      sl,
      tl,
      dt: "t",
      q: text.trim(),
    });
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
    );
    if (!response.ok) {
      throw new Error(`翻译请求失败，HTTP ${response.status}`);
    }
    const data = await response.json();
    const value = Array.isArray(data?.[0])
      ? data[0].map((item) => item?.[0] || "").join("")
      : "";
    return {
      translated: decodeHtml(value),
      detected: data?.[2] || sl,
    };
  };

  const translateWithOfficialApi = async () => {
    if (!apiKey.trim()) {
      throw new Error("请先填写 Google Cloud API Key");
    }
    const params = new URLSearchParams({
      key: apiKey.trim(),
      q: text.trim(),
      target: targetLang || "en",
      format: "text",
    });
    if (sourceLang && sourceLang !== "auto") {
      params.set("source", sourceLang);
    }
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?${params.toString()}`,
      { method: "POST" },
    );
    if (!response.ok) {
      throw new Error(`翻译请求失败，HTTP ${response.status}`);
    }
    const data = await response.json();
    const record = data?.data?.translations?.[0];
    return {
      translated: decodeHtml(record?.translatedText || ""),
      detected: record?.detectedSourceLanguage || sourceLang,
    };
  };

  const handleTranslate = async () => {
    if (!text.trim()) {
      setError("请输入要翻译的文本");
      return;
    }

    setLoading(true);
    setError("");
    setHint("");

    try {
      const result =
        serviceMode === "official"
          ? await translateWithOfficialApi()
          : await translateWithPublicApi();
      setTranslatedText(result.translated);
      setDetectedSource(result.detected || "");
      setSelectedWords([]);
      setHint("翻译完成，可直接勾选词项生成命名");
    } catch (err) {
      setError(err?.message || "翻译失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.navRow}>
        <Link style={styles.backLink} to="/">
          ← 返回菜单
        </Link>
      </div>
      <h1 style={styles.title}>谷歌翻译命名生成器</h1>

      <section style={styles.card}>
        <h2 style={styles.subtitle}>翻译配置</h2>

        <div style={styles.row}>
          <label style={styles.radioItem}>
            <input
              type="radio"
              checked={serviceMode === "public"}
              onChange={() => setServiceMode("public")}
            />
            公开接口
          </label>
          <label style={styles.radioItem}>
            <input
              type="radio"
              checked={serviceMode === "official"}
              onChange={() => setServiceMode("official")}
            />
            官方 API（需 Key）
          </label>
        </div>

        {serviceMode === "official" && (
          <label style={styles.field}>
            <span style={styles.fieldLabel}>Google Cloud API Key</span>
            <input
              style={styles.input}
              type="password"
              placeholder="AIza..."
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </label>
        )}

        <div style={styles.grid}>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>源语言</span>
            <select
              style={styles.select}
              value={sourceLang}
              onChange={(event) => setSourceLang(event.target.value)}
            >
              {LANG_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>目标语言</span>
            <select
              style={styles.select}
              value={targetLang}
              onChange={(event) => setTargetLang(event.target.value)}
            >
              {LANG_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={styles.field}>
          <span style={styles.fieldLabel}>待翻译文本</span>
          <textarea
            style={styles.textarea}
            placeholder="例如：用户订单统计"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>

        <div style={styles.row}>
          <button
            style={styles.primaryButton}
            onClick={handleTranslate}
            disabled={loading}
          >
            {loading ? "翻译中..." : "翻译并生成"}
          </button>
          {PRESETS.map((item) => (
            <button
              key={item}
              style={styles.ghostButton}
              onClick={() => selectPreset(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {hint && <p style={styles.hint}>{hint}</p>}
      </section>

      <section style={styles.card}>
        <h2 style={styles.subtitle}>翻译结果与词项选择</h2>
        <p style={styles.previewLabel}>
          译文：<strong>{translatedText || "暂无"}</strong>
          {detectedSource && (
            <span style={styles.lightText}>
              （检测源语言：{detectedSource}）
            </span>
          )}
        </p>
        <div style={styles.wordWrap}>
          {words.length === 0 ? (
            <span style={styles.lightText}>
              翻译后会自动拆词，点击词项可参与命名拼接。
            </span>
          ) : (
            words.map((word) => {
              const active = selectedWords.includes(word);
              return (
                <button
                  key={`${word}-${active ? "1" : "0"}`}
                  type="button"
                  style={{
                    ...styles.wordChip,
                    ...(active ? styles.wordChipActive : null),
                  }}
                  onClick={() => toggleWord(word)}
                >
                  {word}
                </button>
              );
            })
          )}
        </div>
        <p style={styles.lightText}>
          当前参与拼接词：
          {activeWords.length > 0 ? activeWords.join(", ") : "暂无"}
        </p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.subtitle}>多语言命名结果</h2>
        <div style={styles.resultTable}>
          {rows.map((row) => (
            <div key={row.id} style={styles.resultRow}>
              <div style={styles.resultMeta}>
                <strong>{row.language}</strong>
                <span style={styles.lightText}>{row.rule}</span>
              </div>
              <code style={styles.resultCode}>{row.value}</code>
              <button
                style={styles.copyButton}
                onClick={() => copyText(row.value)}
              >
                复制
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const styles = {
  page: {
    maxWidth: 1240,
    margin: "0 auto",
    padding: 18,
    fontFamily: "'Segoe UI', 'PingFang SC', sans-serif",
    color: "#1f2328",
    background: "linear-gradient(180deg, #f7faff 0%, #ffffff 28%)",
  },
  navRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  backLink: {
    textDecoration: "none",
    color: "#0969da",
    fontSize: 14,
    fontWeight: 600,
  },
  title: { fontSize: 30, marginBottom: 14 },
  subtitle: { fontSize: 20, margin: "0 0 12px 0" },
  card: {
    border: "1px solid #c8d1dc",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    background: "#fff",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
    marginBottom: 10,
  },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 },
  fieldLabel: { fontSize: 14, color: "#4b5563" },
  input: {
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #ccd6e1",
    fontSize: 14,
    outline: "none",
  },
  select: {
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #ccd6e1",
    fontSize: 14,
    outline: "none",
    background: "#fff",
  },
  textarea: {
    minHeight: 80,
    resize: "vertical",
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #ccd6e1",
    fontSize: 14,
    outline: "none",
  },
  primaryButton: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #0969da",
    background: "#0969da",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  ghostButton: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #c8d1dc",
    background: "#f6f8fa",
    color: "#1f2328",
    cursor: "pointer",
  },
  copyButton: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #c8d1dc",
    background: "#f6f8fa",
    color: "#1f2328",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  radioItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
  },
  error: { color: "#b42318", margin: "4px 0 0 0", fontSize: 14 },
  hint: { color: "#05603a", margin: "4px 0 0 0", fontSize: 14 },
  previewLabel: { margin: "0 0 10px 0", fontSize: 15 },
  lightText: { color: "#64748b", fontSize: 13, marginLeft: 8 },
  wordWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  wordChip: {
    borderRadius: 999,
    border: "1px solid #c8d1dc",
    background: "#fff",
    padding: "4px 12px",
    cursor: "pointer",
    fontSize: 14,
  },
  wordChipActive: {
    borderColor: "#0969da",
    background: "#e8f0ff",
    color: "#0747a6",
  },
  resultTable: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  resultRow: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) minmax(220px, 2fr) auto",
    gap: 10,
    alignItems: "center",
    border: "1px solid #d9e2ec",
    borderRadius: 8,
    padding: 10,
    background: "#fbfdff",
  },
  resultMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  resultCode: {
    borderRadius: 8,
    border: "1px solid #d0d7de",
    background: "#fff",
    padding: "6px 10px",
    fontSize: 14,
    overflowX: "auto",
  },
};

export default TranslationNaming;
