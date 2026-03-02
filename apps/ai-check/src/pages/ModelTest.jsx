import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useReactive, useMemoizedFn, useLocalStorageState } from "ahooks";

dayjs.extend(utc);
dayjs.extend(timezone);

const TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

// 默认配置
const DEFAULT_CONFIG = {
  baseUrl: "",
  textPrompt: "你好",
  imageUrl:
    "https://gips1.baidu.com/it/u=1746086795,2510875842&fm=3028&app=3028&f=JPEG&fmt=auto?w=1024&h=1024",
  imagePrompt: "请简要描述这张图片的主要内容。",
};

// 测试类型配置
const TEST_TYPES = [
  { key: "text", label: "文本能力" },
  { key: "image", label: "图像理解" },
  { key: "toolCall", label: "工具调用" },
  { key: "cliApi", label: "CLI 接口" },
  { key: "claudeCode", label: "Claude Code" },
];

const DEFAULT_TYPE = [];

// 工具函数
const toApiRoot = (input) => {
  const cleaned = (input || "").trim().replace(/\/+$/, "");
  if (!cleaned) return DEFAULT_CONFIG.baseUrl;
  return cleaned.endsWith("/v1") ? cleaned : `${cleaned}/v1`;
};

const formatNow = () => dayjs().format(TIME_FORMAT);
const generateId = () =>
  `${dayjs().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;

const maskToken = (token) => {
  const value = (token || "").trim();
  if (!value) return "未填写";
  if (value.length <= 10) return `${value.slice(0, 4)}***${value.slice(-2)}`;
  return `${value.slice(0, 7)}***${value.slice(-4)}`;
};

const extractChatText = (data) => {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((item) => item?.text || "")
    .filter(Boolean)
    .join("\n");
};

const extractResponseText = (data) => {
  if (typeof data?.output_text === "string" && data.output_text)
    return data.output_text;
  if (!Array.isArray(data?.output)) return "";
  return data.output
    .flatMap((item) => item?.content || [])
    .map((part) => part?.text || "")
    .filter(Boolean)
    .join("\n");
};

const parseModelInput = (text) =>
  Array.from(
    new Set(
      (text || "")
        .split(/[,，\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

const normalizeAxiosError = (error) => {
  const status = error?.response?.status || null;
  const payload = error?.response?.data || null;
  const message =
    payload?.error?.message ||
    payload?.message ||
    error?.message ||
    (status ? `HTTP ${status}` : "请求失败");
  const wrapped = new Error(message);
  wrapped.status = status;
  wrapped.payload = payload;
  return wrapped;
};

// 状态样式映射
const getStatusStyle = (status) => {
  const styleMap = {
    成功: styles.statusSuccess,
    失败: styles.statusFail,
    部分失败: styles.statusWarn,
  };
  return styleMap[status] || styles.statusRunning;
};

// 子组件：配置输入字段
const ConfigField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}) => (
  <label style={styles.field}>
    <span style={styles.fieldLabel}>{label}</span>
    <input
      style={styles.input}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  </label>
);

// 子组件：操作按钮
const ActionButton = ({ onClick, disabled, children, primary = false }) => (
  <button
    style={{
      ...styles.button,
      ...(primary ? styles.primaryButton : null),
      ...(disabled ? styles.buttonDisabled : null),
    }}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

// 子组件：可复制标签
const CopyChip = ({ label, value, onCopy, strong = false }) => (
  <button
    style={{ ...styles.copyChip, ...(strong ? styles.copyChipStrong : null) }}
    onClick={() => onCopy(value, label)}
    title={`点击复制${label}`}
    type="button"
  >
    <span style={styles.copyChipLabel}>{label}</span>
    <code style={styles.copyChipValue}>{value}</code>
  </button>
);

// 子组件：模型选择器
const ModelSelector = ({ models, selectedModels, onToggle, disabled }) => (
  <div style={styles.modelList}>
    {models.length === 0 && (
      <div style={styles.empty}>暂无模型，请先拉取。</div>
    )}
    {models.map((model) => (
      <label key={model} style={styles.modelItem}>
        <input
          type="checkbox"
          checked={selectedModels.includes(model)}
          disabled={disabled}
          onChange={() => onToggle(model)}
        />
        <span>{model}</span>
      </label>
    ))}
  </div>
);

// 子组件：测试类型选择器
const TestTypeSelector = ({ selectedTestTypes, onToggle, disabled }) => (
  <div style={styles.modelList}>
    {TEST_TYPES.map((item) => (
      <label key={item.key} style={styles.modelItem}>
        <input
          type="checkbox"
          checked={selectedTestTypes.includes(item.key)}
          disabled={disabled}
          onChange={() => onToggle(item.key)}
        />
        <span>{item.label}</span>
      </label>
    ))}
  </div>
);

// 子组件：单个测试用例
const CaseItem = ({ item }) => (
  <div style={styles.caseItem}>
    <div style={styles.caseMeta}>
      <strong>{item.testType}</strong>
      <span
        style={item.status === "成功" ? styles.textSuccess : styles.textFail}
      >
        {item.status}
      </span>
      <span>{item.startedAt}</span>
      <span>{item.durationMs}ms</span>
    </div>
    {item.preview && <div style={styles.preview}>{item.preview}</div>}
    <details>
      <summary>请求过程</summary>
      <summary>请求</summary>
      <pre style={styles.pre}>{JSON.stringify(item.request, null, 2)}</pre>
      <summary>响应</summary>
      <pre style={styles.pre}>{JSON.stringify(item.response, null, 2)}</pre>
    </details>
  </div>
);

// 子组件：模型日志卡片
const ModelLogCard = ({ log, onCopy }) => (
  <article style={styles.logCard}>
    <header style={styles.logHeader}>
      <div style={styles.logHeaderMain}>
        <CopyChip label="模型" value={log.model} onCopy={onCopy} strong />
        <span style={{ ...styles.statusTag, ...getStatusStyle(log.status) }}>
          {log.status}
        </span>
      </div>
      <div style={styles.logMetaRow}>
        <span>开始：{log.startedAt}</span>
        <span>结束：{log.endedAt || "-"}</span>
        <span>耗时：{log.totalDurationMs}ms</span>
        <span>成功：{log.successCount}</span>
        <span>失败：{log.failCount}</span>
      </div>
    </header>
    <div style={styles.caseList}>
      {log.cases.map((item) => (
        <CaseItem key={item.id} item={item} />
      ))}
    </div>
  </article>
);

// 主组件
const ModelTest = () => {
  const [localUrls, setLocalUrls] = useLocalStorageState(
    'localUrls',
    {
      defaultValue: [],
    },
  );

  const state = useReactive({
    baseUrl: DEFAULT_CONFIG.baseUrl,
    token: "",
    textPrompt: DEFAULT_CONFIG.textPrompt,
    imagePrompt: DEFAULT_CONFIG.imagePrompt,
    imageUrl: DEFAULT_CONFIG.imageUrl,
    models: [],
    selectedModels: [],
    manualModelsText: "",
    selectedTestTypes: DEFAULT_TYPE,
    loadingModels: false,
    running: false,
    logs: [],
    summary: "",
    copyHint: "",
  });

  const apiRoot = useMemo(() => toApiRoot(state.baseUrl), [state.baseUrl]);
  const manualModels = useMemo(
    () => parseModelInput(state.manualModelsText),
    [state.manualModelsText],
  );
  const mergedModels = useMemo(
    () => Array.from(new Set([...state.selectedModels, ...manualModels])),
    [state.selectedModels, manualModels],
  );
  const canRun =
    state.token.trim() &&
    mergedModels.length > 0 &&
    state.selectedTestTypes.length > 0 &&
    !state.running;

  const apiClient = useMemo(
    () =>
      axios.create({
        baseURL: apiRoot,
        timeout: 120000,
        headers: { Authorization: `Bearer ${state.token.trim()}` },
      }),
    [apiRoot, state.token],
  );

  // 更新指定模型日志
  const updateModelLog = useMemoizedFn((id, updater) => {
    state.logs = state.logs.map((item) =>
      item.id === id ? updater(item) : item,
    );
  });

  // 复制文本到剪贴板
  const copyText = useMemoizedFn(async (value, label) => {
    if (!value) {
      state.copyHint = `复制失败：${label} 为空`;
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const input = document.createElement("textarea");
        input.value = value;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      state.copyHint = `${label} 已复制`;
    } catch {
      state.copyHint = `复制失败：浏览器未授权访问剪贴板`;
    }
  });

  // 统一API请求方法
  const requestApi = useMemoizedFn(
    async ({ path, method = "POST", data, params, headers }) => {
      try {
        const response = await apiClient.request({
          url: path,
          method,
          data,
          params,
          headers,
        });
        return { status: response.status, data: response.data };
      } catch (error) {
        throw normalizeAxiosError(error);
      }
    },
  );

  // 拉取模型列表
  const fetchModels = useMemoizedFn(async () => {
    if (!state.token.trim()) {
      state.summary = "请先填写 API Token。";
      return;
    }
    state.loadingModels = true;
    state.summary = "正在拉取模型列表...";
    try {
      const result = await requestApi({ path: "/models", method: "GET" });
      const list = Array.isArray(result.data?.data)
        ? result.data.data.map((item) => item.id).filter(Boolean)
        : [];
      state.models = list;
      state.selectedModels = [];
      state.summary = `模型拉取成功，共 ${list.length} 个。`;
    } catch (error) {
      state.summary = `模型拉取失败：${error.message}`;
    } finally {
      state.loadingModels = false;
    }
  });

  // 创建测试执行器
  const createTestRunners = useMemoizedFn(() => ({
    text: async (model) => {
      const requestBody = {
        model,
        temperature: 0.2,
        max_tokens: 200,
        messages: [{ role: "user", content: state.textPrompt }],
      };
      const startedAt = dayjs();
      const result = await requestApi({
        path: "/chat/completions",
        data: requestBody,
      });
      return {
        status: "成功",
        durationMs: dayjs().diff(startedAt),
        request: requestBody,
        response: result.data,
        preview: extractChatText(result.data) || "(无文本输出)",
      };
    },

    image: async (model) => {
      const requestBody = {
        model,
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: state.imagePrompt },
              { type: "image_url", image_url: { url: state.imageUrl } },
            ],
          },
        ],
      };
      const startedAt = dayjs();
      const result = await requestApi({
        path: "/chat/completions",
        data: requestBody,
      });
      return {
        status: "成功",
        durationMs: dayjs().diff(startedAt),
        request: requestBody,
        response: result.data,
        preview: extractChatText(result.data) || "(无文本输出)",
      };
    },

    toolCall: async (model) => {
      const toolDefinition = {
        type: "function",
        function: {
          name: "get_time",
          description: "返回指定时区的当前时间字符串",
          parameters: {
            type: "object",
            properties: {
              timezone: {
                type: "string",
                description: "时区名称，例如 Asia/Shanghai",
              },
            },
            required: ["timezone"],
          },
        },
      };
      const requestBody = {
        model,
        messages: [
          {
            role: "user",
            content:
              "请调用函数 get_time，参数 timezone 固定为 Asia/Shanghai，然后再给出一句总结。",
          },
        ],
        tools: [toolDefinition],
        tool_choice: "auto",
      };
      const startedAt = dayjs();
      const first = await requestApi({
        path: "/chat/completions",
        data: requestBody,
      });
      const toolCalls = first.data?.choices?.[0]?.message?.tool_calls || [];

      if (!toolCalls.length) {
        return {
          status: "失败",
          durationMs: dayjs().diff(startedAt),
          request: requestBody,
          response: first.data,
          preview: "未检测到 tool_calls。",
        };
      }

      const assistantMessage = first.data.choices[0].message;
      const toolMessages = toolCalls.map((call) => ({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify({
          timezone: "Asia/Shanghai",
          now: dayjs().tz("Asia/Shanghai").format(TIME_FORMAT),
        }),
      }));
      const secondBody = {
        model,
        messages: [...requestBody.messages, assistantMessage, ...toolMessages],
      };
      const second = await requestApi({
        path: "/chat/completions",
        data: secondBody,
      });

      return {
        status: "成功",
        durationMs: dayjs().diff(startedAt),
        request: { first: requestBody, second: secondBody },
        response: { first: first.data, second: second.data },
        preview:
          extractChatText(second.data) || "已触发工具调用，但最终无文本输出。",
      };
    },

    cliApi: async (model) => {
      const requestBody = {
        model,
        input: "请调用函数 cli_echo，参数 text=ping，只需要发起函数调用。",
        tools: [
          {
            type: "function",
            name: "cli_echo",
            description: "回显参数文本",
            parameters: {
              type: "object",
              properties: { text: { type: "string" } },
              required: ["text"],
            },
          },
        ],
        max_output_tokens: 128,
      };
      const startedAt = dayjs();
      const result = await requestApi({
        path: "/responses",
        data: requestBody,
      });
      const output = Array.isArray(result.data?.output)
        ? result.data.output
        : [];
      const hasFunctionCall = output.some(
        (item) => item?.type === "function_call",
      );

      return {
        status: hasFunctionCall ? "成功" : "失败",
        durationMs: dayjs().diff(startedAt),
        request: requestBody,
        response: result.data,
        preview: hasFunctionCall
          ? "检测到 Responses API function_call，CLI 工具接口可用。"
          : `调用成功但未检测到 function_call。输出：${extractResponseText(result.data) || "(空)"}`,
        extra: { hasFunctionCall },
      };
    },

    claudeCode: async (model) => {
      const requestBody = {
        model,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: '你好，这是一个连接测试，请回复"连接成功"',
          },
        ],
      };
      const startedAt = dayjs();
      const result = await requestApi({
        path: "/messages",
        data: requestBody,
        headers: {
          "anthropic-dangerous-direct-browser-access": "true",
          "x-stainless-runtime": "browser:chrome",
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "x-api-key": state.token,
        },
      });

      const hasFunctionCall = result.status == 200;

      return {
        status: hasFunctionCall ? "成功" : "失败",
        durationMs: dayjs().diff(startedAt),
        request: requestBody,
        response: result.data,
        preview: hasFunctionCall
          ? "检测到 Responses API function_call，CLI 工具接口可用。"
          : `调用成功但未检测到 function_call。输出：${extractResponseText(result.data) || "(空)"}`,
        extra: { hasFunctionCall },
      };
    },
  }));

  // 执行单个测试用例
  const runSingleCase = useMemoizedFn(async (model, testType, runner) => {
    const startedAt = dayjs();
    try {
      const result = await runner(model);
      return {
        id: generateId(),
        model,
        testType,
        status: result.status,
        startedAt: startedAt.format(TIME_FORMAT),
        durationMs: result.durationMs,
        request: result.request,
        response: result.response,
        preview: result.preview,
        extra: result.extra || null,
      };
    } catch (error) {
      return {
        id: generateId(),
        model,
        testType,
        status: "失败",
        startedAt: startedAt.format(TIME_FORMAT),
        durationMs: dayjs().diff(startedAt),
        request: null,
        response: null,
        preview: error.message,
        error: {
          message: error.message,
          status: error.status || null,
          payload: error.payload || null,
        },
      };
    }
  });

  // 执行单个模型的所有测试
  const runModelTests = useMemoizedFn(async (model, runners) => {
    const modelLogId = generateId();
    const modelStartedAt = dayjs();

    state.logs = [
      {
        id: modelLogId,
        model,
        tokenMasked: maskToken(state.token),
        startedAt: modelStartedAt.format(TIME_FORMAT),
        endedAt: "",
        status: "进行中",
        totalDurationMs: 0,
        successCount: 0,
        failCount: 0,
        cases: [],
      },
      ...state.logs,
    ];

    const activeTestTypes = TEST_TYPES.filter((item) =>
      state.selectedTestTypes.includes(item.key),
    );
    for (const { key, label } of activeTestTypes) {
      if (typeof runners[key] !== "function") continue;
      state.summary = `模型 ${model}：执行 ${label}...`;
      const caseLog = await runSingleCase(model, label, runners[key]);

      updateModelLog(modelLogId, (old) => {
        const nextCases = [...old.cases, caseLog];
        const successCount = nextCases.filter(
          (item) => item.status === "成功",
        ).length;
        return {
          ...old,
          cases: nextCases,
          successCount,
          failCount: nextCases.length - successCount,
          totalDurationMs: dayjs().diff(modelStartedAt),
        };
      });
    }

    updateModelLog(modelLogId, (old) => ({
      ...old,
      endedAt: formatNow(),
      totalDurationMs: dayjs().diff(modelStartedAt),
      status:
        old.failCount > 0
          ? old.successCount > 0
            ? "部分失败"
            : "失败"
          : "成功",
    }));
  });

  // 串行执行所有模型测试
  const runTests = useMemoizedFn(async () => {
    if (!canRun) return;
    const targetModels = [...mergedModels];
    state.running = true;
    state.summary = `开始串行测试，共 ${targetModels.length} 个模型，每个模型 ${state.selectedTestTypes.length} 项。`;

    try {
      const runners = createTestRunners();
      for (const model of targetModels) {
        await runModelTests(model, runners);
      }
      state.summary = `测试完成，共执行 ${targetModels.length * state.selectedTestTypes.length} 项。`;
      setLocalUrls([
        ...localUrls,
        {
          url: state.baseUrl,
          token: state.token
        }
      ])
    } finally {
      state.running = false;
    }
  });

  // 模型选择操作
  const toggleModel = useMemoizedFn((modelId) => {
    state.selectedModels = state.selectedModels.includes(modelId)
      ? state.selectedModels.filter((id) => id !== modelId)
      : [...state.selectedModels, modelId];
  });

  const selectAllModels = useMemoizedFn(() => {
    state.selectedModels = [...state.models];
  });

  const clearModelSelection = useMemoizedFn(() => {
    state.selectedModels = [];
  });

  // 测试类型选择操作
  const toggleTestType = useMemoizedFn((key) => {
    state.selectedTestTypes = state.selectedTestTypes.includes(key)
      ? state.selectedTestTypes.filter((item) => item !== key)
      : [...state.selectedTestTypes, key];
  });

  const selectAllTestTypes = useMemoizedFn(() => {
    state.selectedTestTypes = TEST_TYPES.map((item) => item.key);
  });

  const clearTestTypes = useMemoizedFn(() => {
    state.selectedTestTypes = [];
  });

  // 日志操作
  const clearLogs = useMemoizedFn(() => {
    state.logs = [];
  });

  const exportLogs = useMemoizedFn(() => {
    const file = new Blob([JSON.stringify(state.logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `openai-model-test-${dayjs().format("YYYYMMDD-HHmmss")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  });

  return (
    <div style={styles.page}>
      <div style={styles.navRow}>
        <Link style={styles.backLink} to="/">
          ← 返回菜单
        </Link>
      </div>
      <h1 style={styles.title}>模型测试</h1>

      <section style={styles.card}>
        <h2 style={styles.subtitle}>连接配置</h2>
        <div style={styles.grid}>
          <ConfigField
            label="API Base URL"
            value={state.baseUrl}
            onChange={(v) => (state.baseUrl = v)}
            placeholder="https://api.openai.com/v1"
          />
          <ConfigField
            label="API Token"
            value={state.token}
            onChange={(v) => (state.token = v)}
            type="password"
            placeholder="sk-..."
          />
          <ConfigField
            label="文本测试提示词"
            value={state.textPrompt}
            onChange={(v) => (state.textPrompt = v)}
          />
          <ConfigField
            label="图像测试提示词"
            value={state.imagePrompt}
            onChange={(v) => (state.imagePrompt = v)}
          />
          <ConfigField
            label="图像 URL"
            value={state.imageUrl}
            onChange={(v) => (state.imageUrl = v)}
            placeholder="https://..."
          />
          <div style={styles.field}>
            <span style={styles.fieldLabel}>API 根地址（自动推导）</span>
            <code style={styles.code}>{apiRoot}</code>
          </div>
        </div>

        <div style={styles.row}>
          <ActionButton
            onClick={fetchModels}
            disabled={
              state.loadingModels || !state.token.trim() || state.running
            }
          >
            {state.loadingModels ? "拉取中..." : "拉取模型列表"}
          </ActionButton>

        </div>

        <div style={styles.highlightArea}>
          <CopyChip
            label="Url"
            value={state.baseUrl.trim()}
            onCopy={copyText}
            strong
          />
          <CopyChip
            label="API Token"
            value={state.token.trim()}
            onCopy={copyText}
            strong
          />
          {mergedModels.map((model) => (
            <CopyChip
              key={model}
              label="模型"
              value={model}
              onCopy={copyText}
            />
          ))}
        </div>

        <p style={styles.summary}>{state.summary || "准备就绪"}</p>
        <div style={{ height: '60px', overflow: 'auto' }}>
          {localUrls.map((it,index) =>
            <p key={index}>
              <a onClick={() => {
                state.baseUrl = it.url
                state.token = it.token
              }}>{it.url}</a>
            </p>
          )}
        </div>
      </section>

      <div style={styles.mainLayout}>
        <div style={styles.leftPane}>
          <section style={styles.card}>
            <h2 style={styles.subtitle}>模型选择</h2>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>
                补充模型（逗号分割，可多填）
              </span>
              <input
                style={styles.input}
                value={state.manualModelsText}
                onChange={(e) => (state.manualModelsText = e.target.value)}
                placeholder="例如：gpt-4o,gpt-4.1, o3-mini"
                disabled={state.running}
              />
              <span style={styles.fieldLabel}>
                会与勾选模型合并去重后执行，当前补充 {manualModels.length}{" "}
                个，合计执行 {mergedModels.length} 个。
              </span>
            </div>
            <div style={styles.row}>
              <ActionButton
                onClick={selectAllModels}
                disabled={state.models.length === 0 || state.running}
              >
                全选
              </ActionButton>
              <ActionButton
                onClick={clearModelSelection}
                disabled={state.selectedModels.length === 0 || state.running}
              >
                清空选择
              </ActionButton>
              <span>勾选：{state.selectedModels.length}</span>
              <span>总计：{mergedModels.length}</span>
            </div>
            <ModelSelector
              models={state.models}
              selectedModels={state.selectedModels}
              onToggle={toggleModel}
              disabled={state.running}
            />
          </section>
        </div>

        <div style={styles.rightPane}>
          <section style={styles.card}>
            <h2 style={styles.subtitle}>测试类型选择</h2>
            <div style={styles.row}>
              <ActionButton
                onClick={selectAllTestTypes}
                disabled={
                  state.selectedTestTypes.length === TEST_TYPES.length ||
                  state.running
                }
              >
                全选
              </ActionButton>
              <ActionButton
                onClick={clearTestTypes}
                disabled={state.selectedTestTypes.length === 0 || state.running}
              >
                清空选择
              </ActionButton>
              <span>已选：{state.selectedTestTypes.length}</span>

              <ActionButton onClick={runTests} disabled={!canRun} primary>
                {state.running ? "测试中..." : "开始串行测试"}
              </ActionButton>
            </div>
            <TestTypeSelector
              selectedTestTypes={state.selectedTestTypes}
              onToggle={toggleTestType}
              disabled={state.running}
            />
          </section>

          <section style={styles.card}>
            <h2 style={styles.subtitle}>
              模型请求日志（按模型归并）
              <ActionButton
                onClick={clearLogs}
                disabled={state.running || state.logs.length === 0}
              >
                清空日志
              </ActionButton>
              &nbsp;
              <ActionButton
                onClick={exportLogs}
                disabled={state.logs.length === 0}
              >
                导出日志 JSON
              </ActionButton>
            </h2>
            {state.logs.length === 0 ? (
              <div style={styles.empty}>暂无日志。</div>
            ) : (
              <div style={styles.logList}>
                {state.logs.map((log) => (
                  <ModelLogCard key={log.id} log={log} onCopy={copyText} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    margin: "0 auto",
    padding: 20,
    fontFamily: "'Segoe UI', 'PingFang SC', sans-serif",
  },
  title: { fontSize: 30, marginBottom: 14 },
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
  subtitle: { fontSize: 20, margin: "0 0 12px 0" },
  card: {
    border: "1px solid #c8d1dc",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    background: "#fff",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
  },
  mainLayout: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "flex-start",
  },
  leftPane: {
    // flex: "1 1 440px",
    // minWidth: 320,
    width: "32%",
  },
  rightPane: {
    flex: "1.25 1 520px",
    minWidth: 360,
  },
  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 10,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
    marginBottom: 12,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 14, color: "#4b5563" },
  input: {
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #ccd6e1",
    fontSize: 14,
    outline: "none",
  },
  button: {
    padding: "8px 13px",
    borderRadius: 8,
    border: "1px solid #c8d1dc",
    background: "#f6f8fa",
    cursor: "pointer",
    color: "#1f2328",
  },
  primaryButton: {
    background: "#0969da",
    border: "1px solid #0969da",
    color: "#fff",
    fontWeight: 600,
  },
  buttonDisabled: { opacity: 0.65, cursor: "not-allowed" },
  code: {
    background: "#f5f8fc",
    border: "1px solid #d3dce7",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 14,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  highlightArea: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    border: "1px dashed #9eb5cf",
    background: "linear-gradient(90deg, #f2f8ff 0%, #f8fbff 100%)",
  },
  copyChip: {
    border: "1px solid #bcd0e8",
    borderRadius: 999,
    background: "#fff",
    padding: "6px 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    color: "#183153",
    maxWidth: "100%",
  },
  copyChipStrong: {
    borderColor: "#0969da",
    boxShadow: "0 0 0 2px rgba(9, 105, 218, 0.12)",
  },
  copyChipLabel: { fontSize: 14, fontWeight: 700, color: "#0f3c78" },
  copyChipValue: {
    fontSize: 14,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 280,
  },
  summary: { margin: 0, fontSize: 14, color: "#374151" },
  copyHint: { margin: "6px 0 0 0", color: "#0f5132", fontSize: 14 },
  modelList: {
    maxHeight: 220,
    overflow: "auto",
    border: "1px solid #d0d7de",
    borderRadius: 8,
    padding: 8,
    display: "flex",
    flexWrap: "wrap",
    alignContent: "flex-start",
    gap: 8,
  },
  modelItem: {
    display: "inline-flex",
    gap: 6,
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 999,
    background: "#f8fbff",
    border: "1px solid #d9e2ec",
    whiteSpace: "nowrap",
  },
  logList: { display: "flex", flexDirection: "column", gap: 8 },
  logCard: {
    border: "1px solid #d0d7de",
    borderRadius: 10,
    overflow: "hidden",
    background: "#fafcff",
  },
  logHeader: {
    padding: 9,
    borderBottom: "1px solid #e5edf5",
    background: "#f4f8ff",
  },
  logHeaderMain: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  logMetaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    fontSize: 13,
    color: "#4b5563",
  },
  statusTag: {
    fontSize: 13,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid transparent",
  },
  statusSuccess: {
    color: "#116329",
    background: "#dcffe4",
    borderColor: "#9addaf",
  },
  statusFail: {
    color: "#a40e26",
    background: "#ffe5ea",
    borderColor: "#ffb5c0",
  },
  statusWarn: {
    color: "#9a6700",
    background: "#fff4d5",
    borderColor: "#ffd880",
  },
  statusRunning: {
    color: "#0550ae",
    background: "#ddeeff",
    borderColor: "#9cc5ff",
  },
  caseList: { display: "flex", flexDirection: "column", gap: 8, padding: 9 },
  caseItem: {
    border: "1px solid #dbe5ef",
    borderRadius: 8,
    background: "#fff",
    padding: 8,
  },
  caseMeta: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    fontSize: 13,
    marginBottom: 4,
  },
  textSuccess: { color: "#1a7f37", fontWeight: 700 },
  textFail: { color: "#d1242f", fontWeight: 700 },
  preview: {
    fontSize: 13,
    marginBottom: 6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  pre: {
    marginTop: 6,
    maxHeight: 220,
    overflow: "auto",
    background: "#fff",
    border: "1px solid #d0d7de",
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
  },
  empty: { color: "#57606a", fontSize: 14 },
};

export default ModelTest;
