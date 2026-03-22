import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMemoizedFn, useReactive } from "ahooks";

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

// 语言选择器表单配置，消除源语言/目标语言重复 JSX
const LANG_SELECT_FIELDS = [
  { label: "源语言", stateKey: "sourceLang" },
  { label: "目标语言", stateKey: "targetLang" },
];

// 命名规则配置：caseType 决定基础命名风格，prefix/suffix 拼接最终名称
const NAME_RULES = [
  { id: "jsComponent", language: "JavaScript", rule: "组件（PascalCase，不含后缀）", caseType: "pascal" },
  { id: "jsPage", language: "JavaScript", rule: "页面（PascalCasePage）", caseType: "pascal", suffix: "Page" },
  { id: "jsLayout", language: "JavaScript", rule: "布局（PascalCaseLayout）", caseType: "pascal", suffix: "Layout" },
  { id: "jsHook", language: "JavaScript", rule: "Hook（usePascalCase）", caseType: "pascal", prefix: "use" },
  { id: "jsContext", language: "JavaScript", rule: "上下文（PascalCaseContext）", caseType: "pascal", suffix: "Context" },
  { id: "jsProvider", language: "JavaScript", rule: "Provider（PascalCaseProvider）", caseType: "pascal", suffix: "Provider" },
  { id: "jsStore", language: "JavaScript", rule: "状态仓库（camelCaseStore）", caseType: "camel", suffix: "Store" },
  { id: "jsSlice", language: "JavaScript", rule: "状态切片（camelCaseSlice）", caseType: "camel", suffix: "Slice" },
  { id: "jsReducer", language: "JavaScript", rule: "Reducer（camelCaseReducer）", caseType: "camel", suffix: "Reducer" },
  { id: "jsService", language: "JavaScript", rule: "业务服务（camelCaseService）", caseType: "camel", suffix: "Service" },
  { id: "jsApi", language: "JavaScript", rule: "接口封装（camelCaseApi）", caseType: "camel", suffix: "Api" },
  { id: "jsUtil", language: "JavaScript", rule: "工具模块（camelCaseUtils）", caseType: "camel", suffix: "Utils" },
  { id: "jsConstants", language: "JavaScript", rule: "常量模块（camelCaseConstants）", caseType: "camel", suffix: "Constants" },
  { id: "jsTypes", language: "JavaScript", rule: "类型定义（camelCaseTypes）", caseType: "camel", suffix: "Types" },
  { id: "jsRoutes", language: "JavaScript", rule: "路由配置（camelCaseRoutes）", caseType: "camel", suffix: "Routes" },
  { id: "jsConfig", language: "JavaScript", rule: "配置模块（camelCaseConfig）", caseType: "camel", suffix: "Config" },
  { id: "jsStyles", language: "JavaScript", rule: "样式模块（PascalCaseStyles）", caseType: "pascal", suffix: "Styles" },
  { id: "javaController", language: "Java", rule: "控制器（PascalCaseController）", caseType: "pascal", suffix: "Controller" },
  { id: "javaService", language: "Java", rule: "服务层（PascalCaseService）", caseType: "pascal", suffix: "Service" },
  { id: "javaInterface", language: "Java", rule: "服务接口（IPascalCaseService）", caseType: "pascal", prefix: "I", suffix: "Service" },
  { id: "javaImpl", language: "Java", rule: "服务实现（PascalCaseServiceImpl）", caseType: "pascal", suffix: "ServiceImpl" },
  { id: "javaRepository", language: "Java", rule: "仓储层（PascalCaseRepository）", caseType: "pascal", suffix: "Repository" },
  { id: "javaDao", language: "Java", rule: "DAO（PascalCaseDao）", caseType: "pascal", suffix: "Dao" },
  { id: "javaMapper", language: "Java", rule: "Mapper（PascalCaseMapper）", caseType: "pascal", suffix: "Mapper" },
  { id: "javaEntity", language: "Java", rule: "实体（PascalCaseEntity）", caseType: "pascal", suffix: "Entity" },
  { id: "javaDO", language: "Java", rule: "数据对象（PascalCaseDO）", caseType: "pascal", suffix: "DO" },
  { id: "javaPO", language: "Java", rule: "持久对象（PascalCasePO）", caseType: "pascal", suffix: "PO" },
  { id: "javaDTO", language: "Java", rule: "数据传输（PascalCaseDTO）", caseType: "pascal", suffix: "DTO" },
  { id: "javaVO", language: "Java", rule: "视图对象（PascalCaseVO）", caseType: "pascal", suffix: "VO" },
  { id: "javaBO", language: "Java", rule: "业务对象（PascalCaseBO）", caseType: "pascal", suffix: "BO" },
  { id: "javaQuery", language: "Java", rule: "查询对象（PascalCaseQuery）", caseType: "pascal", suffix: "Query" },
  { id: "javaCommand", language: "Java", rule: "命令对象（PascalCaseCommand）", caseType: "pascal", suffix: "Command" },
  { id: "javaParam", language: "Java", rule: "参数对象（PascalCaseParam）", caseType: "pascal", suffix: "Param" },
  { id: "javaRequest", language: "Java", rule: "请求模型（PascalCaseRequest）", caseType: "pascal", suffix: "Request" },
  { id: "javaResponse", language: "Java", rule: "响应模型（PascalCaseResponse）", caseType: "pascal", suffix: "Response" },
  { id: "javaConverter", language: "Java", rule: "转换器（PascalCaseConverter）", caseType: "pascal", suffix: "Converter" },
  { id: "javaConfig", language: "Java", rule: "配置类（PascalCaseConfig）", caseType: "pascal", suffix: "Config" },
  { id: "javaException", language: "Java", rule: "异常类（PascalCaseException）", caseType: "pascal", suffix: "Exception" },
  { id: "javaEnum", language: "Java", rule: "枚举类（PascalCaseEnum）", caseType: "pascal", suffix: "Enum" },
  { id: "javaValidator", language: "Java", rule: "校验器（PascalCaseValidator）", caseType: "pascal", suffix: "Validator" },
  { id: "javaAspect", language: "Java", rule: "切面（PascalCaseAspect）", caseType: "pascal", suffix: "Aspect" },
  { id: "javaInterceptor", language: "Java", rule: "拦截器（PascalCaseInterceptor）", caseType: "pascal", suffix: "Interceptor" },
  { id: "javaFilter", language: "Java", rule: "过滤器（PascalCaseFilter）", caseType: "pascal", suffix: "Filter" },
  { id: "javaListener", language: "Java", rule: "监听器（PascalCaseListener）", caseType: "pascal", suffix: "Listener" },
  { id: "javaJob", language: "Java", rule: "定时任务（PascalCaseJob）", caseType: "pascal", suffix: "Job" },
  { id: "javaFacade", language: "Java", rule: "门面（PascalCaseFacade）", caseType: "pascal", suffix: "Facade" },
  { id: "javaClient", language: "Java", rule: "远程客户端（PascalCaseClient）", caseType: "pascal", suffix: "Client" },
  { id: "pyModule", language: "Python", rule: "模块（snake_case）", caseType: "snake" },
  { id: "pyController", language: "Python", rule: "控制器（snake_case_controller）", caseType: "snake", suffix: "controller" },
  { id: "pyService", language: "Python", rule: "服务层（snake_case_service）", caseType: "snake", suffix: "service" },
  { id: "pyDao", language: "Python", rule: "DAO（snake_case_dao）", caseType: "snake", suffix: "dao" },
  { id: "pyRepository", language: "Python", rule: "仓储层（snake_case_repository）", caseType: "snake", suffix: "repository" },
  { id: "pyModel", language: "Python", rule: "模型（snake_case_model）", caseType: "snake", suffix: "model" },
  { id: "pySchema", language: "Python", rule: "Schema（snake_case_schema）", caseType: "snake", suffix: "schema" },
  { id: "pyDto", language: "Python", rule: "DTO（snake_case_dto）", caseType: "snake", suffix: "dto" },
  { id: "pyVo", language: "Python", rule: "VO（snake_case_vo）", caseType: "snake", suffix: "vo" },
  { id: "pyUtils", language: "Python", rule: "工具模块（snake_case_utils）", caseType: "snake", suffix: "utils" },
  { id: "pyApi", language: "Python", rule: "接口封装（snake_case_api）", caseType: "snake", suffix: "api" },
  { id: "pyRouter", language: "Python", rule: "路由（snake_case_router）", caseType: "snake", suffix: "router" },
  { id: "pyConfig", language: "Python", rule: "配置（snake_case_config）", caseType: "snake", suffix: "config" },
  { id: "pyConstants", language: "Python", rule: "常量（snake_case_constants）", caseType: "snake", suffix: "constants" },
  { id: "pyValidator", language: "Python", rule: "校验器（snake_case_validator）", caseType: "snake", suffix: "validator" },
  { id: "pyTask", language: "Python", rule: "任务/定时（snake_case_task）", caseType: "snake", suffix: "task" },
  { id: "pyHandler", language: "Python", rule: "处理器（snake_case_handler）", caseType: "snake", suffix: "handler" },
  { id: "pyTest", language: "Python", rule: "测试（test_snake_case）", caseType: "snake", prefix: "test_" },
];

// 借助 DOMParser 解码翻译 API 返回的 HTML 实体
const decodeHtml = (text) => {
  if (!text) return "";
  const parser = new DOMParser();
  return parser.parseFromString(text, "text/html").documentElement.textContent;
};

// 将翻译结果拆为纯英文单词数组，用于后续命名拼接
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

// 确保文件名以合法字母开头，避免数字打头导致命名不合规
const ensurePascalFileName = (value) => {
  if (!value) return "Module";
  if (/^[A-Za-z]/.test(value)) return value;
  return `Module${value}`;
};

const ensureCamelFileName = (value) => {
  if (!value) return "moduleName";
  if (/^[A-Za-z]/.test(value)) return value;
  return `module${value}`;
};

const ensureSnakeFileName = (value) => {
  const base = value || "module_name";
  if (/^[a-z]/.test(base)) return base;
  return `module_${base}`;
};

// 根据 NAME_RULES 配置，将单词数组转换为各语言各场景的命名结果
const buildNameRows = (words) => {
  const bases = {
    pascal: ensurePascalFileName(toPascalCase(words)),
    camel: ensureCamelFileName(toCamelCase(words)),
    snake: ensureSnakeFileName(toSnakeCase(words)),
  };

  return NAME_RULES.map(({ id, language, rule, caseType, prefix = "", suffix = "" }) => {
    const base = bases[caseType];
    // snake_case 风格下有后缀时用下划线连接
    const separator = caseType === "snake" && suffix ? "_" : "";
    return { id, language, rule, value: `${prefix}${base}${separator}${suffix}` };
  });
};

// 按语言分组便于分栏展示
const groupByLanguage = (rows) =>
  rows.reduce((acc, row) => {
    if (!acc[row.language]) {
      acc[row.language] = [];
    }
    acc[row.language].push(row);
    return acc;
  }, {});

// 单个语言分组的命名结果卡片
const NamingResultGroup = ({ language, items, onCopy }) => (
  <div style={styles.resultGroup}>
    <div style={styles.resultGroupHeader}>
      <strong>{language}</strong>
      <span style={styles.groupCount}>{items.length}</span>
    </div>
    <div style={styles.groupList}>
      {items.map((row) => (
        <div key={row.id} style={styles.groupRow}>
          <span style={styles.groupRule}>{row.rule}</span>
          <code style={styles.resultCodeCompact}>
            <a style={styles.resultLink} onClick={() => onCopy(row.value)}>
              {row.value}
            </a>
          </code>
        </div>
      ))}
    </div>
  </div>
);

const TranslationNaming = () => {
  const state = useReactive({
    sourceLang: "zh-CN",
    targetLang: "en",
    text: "",
    translatedText: "",
    detectedSource: "",
    selectedWords: [],
    loading: false,
    error: "",
    hint: "",
  });

  // 派生数据：拆词 → 活跃词项 → 命名行 → 按语言分组
  const words = useMemo(
    () => splitWords(state.translatedText),
    [state.translatedText],
  );
  const activeWords = useMemo(
    () => (state.selectedWords.length > 0 ? state.selectedWords : words),
    [state.selectedWords, words],
  );
  const rows = useMemo(() => buildNameRows(activeWords), [activeWords]);
  const groupedRows = useMemo(() => groupByLanguage(rows), [rows]);

  const copyText = useMemoizedFn(async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      state.hint = `已复制：${value}`;
    } catch {
      state.hint = "复制失败：浏览器未授权剪贴板";
    }
  });

  const toggleWord = useMemoizedFn((word) => {
    const exists = state.selectedWords.includes(word);
    state.selectedWords = exists
      ? state.selectedWords.filter((item) => item !== word)
      : [...state.selectedWords, word];
  });

  const selectPreset = useMemoizedFn((value) => {
    state.text = value;
    state.error = "";
    state.hint = "";
  });

  // 调用 Google 公共翻译接口获取译文
  const translateWithPublicApi = useMemoizedFn(async () => {
    const sl = state.sourceLang || "auto";
    const tl = state.targetLang || "en";
    const params = new URLSearchParams({
      client: "gtx",
      sl,
      tl,
      dt: "t",
      q: state.text.trim(),
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
  });

  // 翻译入口：校验 → 请求 → 更新状态
  const handleTranslate = useMemoizedFn(async () => {
    if (!state.text.trim()) {
      state.error = "请输入要翻译的文本";
      return;
    }

    state.loading = true;
    state.error = "";
    state.hint = "";

    try {
      const result = await translateWithPublicApi();
      state.translatedText = result.translated;
      state.detectedSource = result.detected || "";
      state.selectedWords = [];
      state.hint = "翻译完成，可直接勾选词项生成命名";
    } catch (err) {
      state.error = err?.message || "翻译失败，请稍后重试";
    } finally {
      state.loading = false;
    }
  });

  return (
    <div style={styles.page}>
      <div style={styles.navRow}>
        <Link style={styles.backLink} to="/">
          ← 返回菜单
        </Link>
      </div>
      <h1 style={styles.title}>翻译文件命名生成器</h1>

      <section style={styles.card}>
        <h2 style={styles.subtitle}>翻译配置</h2>

        <div style={styles.grid}>
          {LANG_SELECT_FIELDS.map(({ label, stateKey }) => (
            <label key={stateKey} style={styles.field}>
              <span style={styles.fieldLabel}>{label}</span>
              <select
                style={styles.select}
                value={state[stateKey]}
                onChange={(event) => (state[stateKey] = event.target.value)}
              >
                {LANG_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <label style={styles.field}>
          <span style={styles.fieldLabel}>待翻译文本</span>
          <input
            style={styles.textarea}
            placeholder="例如：用户订单统计"
            value={state.text}
            onChange={(event) => (state.text = event.target.value)}
          />
        </label>

        <div style={styles.row}>
          <button
            style={styles.primaryButton}
            onClick={handleTranslate}
            disabled={state.loading}
          >
            {state.loading ? "翻译中..." : "翻译并生成"}
          </button>
          {PRESETS.map((item) => (
            <a
              key={item}
              style={styles.ghostButton}
              onClick={() => selectPreset(item)}
            >
              {item}
            </a>
          ))}
        </div>

        {state.error && <p style={styles.error}>{state.error}</p>}
        {state.hint && <p style={styles.hint}>{state.hint}</p>}
      </section>

      <section style={styles.card}>
        <h2 style={styles.subtitle}>翻译结果与词项选择</h2>
        <p style={styles.previewLabel}>
          译文：<strong>{state.translatedText || "暂无"}</strong>
          {state.detectedSource && (
            <span style={styles.lightText}>
              （检测源语言：{state.detectedSource}）
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
              const active = state.selectedWords.includes(word);
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
        <h2 style={styles.subtitle}>文件命名结果（JS / Java / Python）</h2>
        <div style={styles.resultGrid}>
          {Object.entries(groupedRows).map(([language, items]) => (
            <NamingResultGroup
              key={language}
              language={language}
              items={items}
              onCopy={copyText}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const styles = {
  page: {
    margin: "0 auto",
    padding: 20,
  },
  navRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  backLink: {
    textDecoration: "none",
    color: "#0969da",
    fontSize: 14,
    fontWeight: 600,
  },
  title: { fontSize: 18, marginBottom: 6 },
  subtitle: { fontSize: 18, margin: "0 0 12px 0" },
  card: {
    border: "1px solid #c8d1dc",
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    background: "#fff",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
    marginBottom: 10,
  },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 },
  fieldLabel: { fontSize: 14, color: "#4b5563" },
  select: {
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #ccd6e1",
    fontSize: 14,
    outline: "none",
    background: "#fff",
  },
  textarea: {
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
    borderRadius: 8,
    color: "#f60",
    cursor: "pointer",
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
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
  },
  resultGroup: {
    border: "1px solid #d9e2ec",
    borderRadius: 10,
    padding: 12,
    background: "#fbfdff",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  resultGroupHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 15,
  },
  groupCount: {
    fontSize: 12,
    color: "#64748b",
    background: "#eef2ff",
    borderRadius: 999,
    padding: "2px 8px",
  },
  groupList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  groupRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 8,
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
  },
  groupRule: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.3,
    display: "inline-block",
    width: "120px",
  },
  resultCodeCompact: {
    borderRadius: 8,
    padding: "4px 8px",
    fontSize: 13,
    overflowX: "auto",
    background: "#f8fafc",
  },
  resultLink: {
    color: "#137fff",
    cursor: "pointer",
    fontSize: 18,
  },
};

export default TranslationNaming;
