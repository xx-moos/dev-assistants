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

const buildNameRows = (words) => {
  const pascal = ensurePascalFileName(toPascalCase(words));
  const camel = ensureCamelFileName(toCamelCase(words));
  const snake = ensureSnakeFileName(toSnakeCase(words));

  return [
    {
      id: "jsComponent",
      language: "JavaScript",
      rule: "组件（PascalCase，不含后缀）",
      value: pascal,
    },
    {
      id: "jsPage",
      language: "JavaScript",
      rule: "页面（PascalCasePage）",
      value: `${pascal}Page`,
    },
    {
      id: "jsLayout",
      language: "JavaScript",
      rule: "布局（PascalCaseLayout）",
      value: `${pascal}Layout`,
    },
    {
      id: "jsHook",
      language: "JavaScript",
      rule: "Hook（usePascalCase）",
      value: `use${pascal}`,
    },
    {
      id: "jsContext",
      language: "JavaScript",
      rule: "上下文（PascalCaseContext）",
      value: `${pascal}Context`,
    },
    {
      id: "jsProvider",
      language: "JavaScript",
      rule: "Provider（PascalCaseProvider）",
      value: `${pascal}Provider`,
    },
    {
      id: "jsStore",
      language: "JavaScript",
      rule: "状态仓库（camelCaseStore）",
      value: `${camel}Store`,
    },
    {
      id: "jsSlice",
      language: "JavaScript",
      rule: "状态切片（camelCaseSlice）",
      value: `${camel}Slice`,
    },
    {
      id: "jsReducer",
      language: "JavaScript",
      rule: "Reducer（camelCaseReducer）",
      value: `${camel}Reducer`,
    },
    {
      id: "jsService",
      language: "JavaScript",
      rule: "业务服务（camelCaseService）",
      value: `${camel}Service`,
    },
    {
      id: "jsApi",
      language: "JavaScript",
      rule: "接口封装（camelCaseApi）",
      value: `${camel}Api`,
    },
    {
      id: "jsUtil",
      language: "JavaScript",
      rule: "工具模块（camelCaseUtils）",
      value: `${camel}Utils`,
    },
    {
      id: "jsConstants",
      language: "JavaScript",
      rule: "常量模块（camelCaseConstants）",
      value: `${camel}Constants`,
    },
    {
      id: "jsTypes",
      language: "JavaScript",
      rule: "类型定义（camelCaseTypes）",
      value: `${camel}Types`,
    },
    {
      id: "jsRoutes",
      language: "JavaScript",
      rule: "路由配置（camelCaseRoutes）",
      value: `${camel}Routes`,
    },
    {
      id: "jsConfig",
      language: "JavaScript",
      rule: "配置模块（camelCaseConfig）",
      value: `${camel}Config`,
    },
    {
      id: "jsStyles",
      language: "JavaScript",
      rule: "样式模块（PascalCaseStyles）",
      value: `${pascal}Styles`,
    },
    {
      id: "javaController",
      language: "Java",
      rule: "控制器（PascalCaseController）",
      value: `${pascal}Controller`,
    },
    {
      id: "javaService",
      language: "Java",
      rule: "服务层（PascalCaseService）",
      value: `${pascal}Service`,
    },
    {
      id: "javaInterface",
      language: "Java",
      rule: "服务接口（IPascalCaseService）",
      value: `I${pascal}Service`,
    },
    {
      id: "javaImpl",
      language: "Java",
      rule: "服务实现（PascalCaseServiceImpl）",
      value: `${pascal}ServiceImpl`,
    },
    {
      id: "javaRepository",
      language: "Java",
      rule: "仓储层（PascalCaseRepository）",
      value: `${pascal}Repository`,
    },
    {
      id: "javaDao",
      language: "Java",
      rule: "DAO（PascalCaseDao）",
      value: `${pascal}Dao`,
    },
    {
      id: "javaMapper",
      language: "Java",
      rule: "Mapper（PascalCaseMapper）",
      value: `${pascal}Mapper`,
    },
    {
      id: "javaEntity",
      language: "Java",
      rule: "实体（PascalCaseEntity）",
      value: `${pascal}Entity`,
    },
    {
      id: "javaDO",
      language: "Java",
      rule: "数据对象（PascalCaseDO）",
      value: `${pascal}DO`,
    },
    {
      id: "javaPO",
      language: "Java",
      rule: "持久对象（PascalCasePO）",
      value: `${pascal}PO`,
    },
    {
      id: "javaDTO",
      language: "Java",
      rule: "数据传输（PascalCaseDTO）",
      value: `${pascal}DTO`,
    },
    {
      id: "javaVO",
      language: "Java",
      rule: "视图对象（PascalCaseVO）",
      value: `${pascal}VO`,
    },
    {
      id: "javaBO",
      language: "Java",
      rule: "业务对象（PascalCaseBO）",
      value: `${pascal}BO`,
    },
    {
      id: "javaQuery",
      language: "Java",
      rule: "查询对象（PascalCaseQuery）",
      value: `${pascal}Query`,
    },
    {
      id: "javaCommand",
      language: "Java",
      rule: "命令对象（PascalCaseCommand）",
      value: `${pascal}Command`,
    },
    {
      id: "javaParam",
      language: "Java",
      rule: "参数对象（PascalCaseParam）",
      value: `${pascal}Param`,
    },
    {
      id: "javaRequest",
      language: "Java",
      rule: "请求模型（PascalCaseRequest）",
      value: `${pascal}Request`,
    },
    {
      id: "javaResponse",
      language: "Java",
      rule: "响应模型（PascalCaseResponse）",
      value: `${pascal}Response`,
    },
    {
      id: "javaConverter",
      language: "Java",
      rule: "转换器（PascalCaseConverter）",
      value: `${pascal}Converter`,
    },
    {
      id: "javaConfig",
      language: "Java",
      rule: "配置类（PascalCaseConfig）",
      value: `${pascal}Config`,
    },
    {
      id: "javaException",
      language: "Java",
      rule: "异常类（PascalCaseException）",
      value: `${pascal}Exception`,
    },
    {
      id: "javaEnum",
      language: "Java",
      rule: "枚举类（PascalCaseEnum）",
      value: `${pascal}Enum`,
    },
    {
      id: "javaValidator",
      language: "Java",
      rule: "校验器（PascalCaseValidator）",
      value: `${pascal}Validator`,
    },
    {
      id: "javaAspect",
      language: "Java",
      rule: "切面（PascalCaseAspect）",
      value: `${pascal}Aspect`,
    },
    {
      id: "javaInterceptor",
      language: "Java",
      rule: "拦截器（PascalCaseInterceptor）",
      value: `${pascal}Interceptor`,
    },
    {
      id: "javaFilter",
      language: "Java",
      rule: "过滤器（PascalCaseFilter）",
      value: `${pascal}Filter`,
    },
    {
      id: "javaListener",
      language: "Java",
      rule: "监听器（PascalCaseListener）",
      value: `${pascal}Listener`,
    },
    {
      id: "javaJob",
      language: "Java",
      rule: "定时任务（PascalCaseJob）",
      value: `${pascal}Job`,
    },
    {
      id: "javaFacade",
      language: "Java",
      rule: "门面（PascalCaseFacade）",
      value: `${pascal}Facade`,
    },
    {
      id: "javaClient",
      language: "Java",
      rule: "远程客户端（PascalCaseClient）",
      value: `${pascal}Client`,
    },
    {
      id: "pyModule",
      language: "Python",
      rule: "模块（snake_case）",
      value: snake,
    },
    {
      id: "pyController",
      language: "Python",
      rule: "控制器（snake_case_controller）",
      value: `${snake}_controller`,
    },
    {
      id: "pyService",
      language: "Python",
      rule: "服务层（snake_case_service）",
      value: `${snake}_service`,
    },
    {
      id: "pyDao",
      language: "Python",
      rule: "DAO（snake_case_dao）",
      value: `${snake}_dao`,
    },
    {
      id: "pyRepository",
      language: "Python",
      rule: "仓储层（snake_case_repository）",
      value: `${snake}_repository`,
    },
    {
      id: "pyModel",
      language: "Python",
      rule: "模型（snake_case_model）",
      value: `${snake}_model`,
    },
    {
      id: "pySchema",
      language: "Python",
      rule: "Schema（snake_case_schema）",
      value: `${snake}_schema`,
    },
    {
      id: "pyDto",
      language: "Python",
      rule: "DTO（snake_case_dto）",
      value: `${snake}_dto`,
    },
    {
      id: "pyVo",
      language: "Python",
      rule: "VO（snake_case_vo）",
      value: `${snake}_vo`,
    },
    {
      id: "pyUtils",
      language: "Python",
      rule: "工具模块（snake_case_utils）",
      value: `${snake}_utils`,
    },
    {
      id: "pyApi",
      language: "Python",
      rule: "接口封装（snake_case_api）",
      value: `${snake}_api`,
    },
    {
      id: "pyRouter",
      language: "Python",
      rule: "路由（snake_case_router）",
      value: `${snake}_router`,
    },
    {
      id: "pyConfig",
      language: "Python",
      rule: "配置（snake_case_config）",
      value: `${snake}_config`,
    },
    {
      id: "pyConstants",
      language: "Python",
      rule: "常量（snake_case_constants）",
      value: `${snake}_constants`,
    },
    {
      id: "pyValidator",
      language: "Python",
      rule: "校验器（snake_case_validator）",
      value: `${snake}_validator`,
    },
    {
      id: "pyTask",
      language: "Python",
      rule: "任务/定时（snake_case_task）",
      value: `${snake}_task`,
    },
    {
      id: "pyHandler",
      language: "Python",
      rule: "处理器（snake_case_handler）",
      value: `${snake}_handler`,
    },
    {
      id: "pyTest",
      language: "Python",
      rule: "测试（test_snake_case）",
      value: `test_${snake}`,
    },
  ];
};

const TranslationNaming = () => {
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
  const groupedRows = useMemo(
    () =>
      rows.reduce((acc, row) => {
        if (!acc[row.language]) {
          acc[row.language] = [];
        }
        acc[row.language].push(row);
        return acc;
      }, {}),
    [rows],
  );

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

  const handleTranslate = async () => {
    if (!text.trim()) {
      setError("请输入要翻译的文本");
      return;
    }

    setLoading(true);
    setError("");
    setHint("");

    try {
      const result = await translateWithPublicApi();
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
      <h1 style={styles.title}>翻译文件命名生成器</h1>

      <section style={styles.card}>
        <h2 style={styles.subtitle}>翻译配置</h2>

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
          <input
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
            <a
              key={item}
              style={styles.ghostButton}
              onClick={() => selectPreset(item)}
            >
              {item}
            </a>
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
        <h2 style={styles.subtitle}>文件命名结果（JS / Java / Python）</h2>
        <div style={styles.resultGrid}>
          {Object.entries(groupedRows).map(([language, items]) => (
            <div key={language} style={styles.resultGroup}>
              <div style={styles.resultGroupHeader}>
                <strong>{language}</strong>
                <span style={styles.groupCount}>{items.length}</span>
              </div>
              <div style={styles.groupList}>
                {items.map((row) => (
                  <div key={row.id} style={styles.groupRow}>
                    <span style={styles.groupRule}>{row.rule}</span>
                    <code style={styles.resultCodeCompact}>
                      <a
                        style={styles.resultLink}
                        onClick={() => copyText(row.value)}
                      >
                        {row.value}
                      </a>
                    </code>
                  </div>
                ))}
              </div>
            </div>
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
