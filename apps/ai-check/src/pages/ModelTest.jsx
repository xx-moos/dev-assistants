import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useReactive, useMemoizedFn, useLocalStorageState } from "ahooks";
import {
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Empty,
  Input,
  Row,
  Col,
  Space,
  Spin,
  Tag,
  Typography,
  Select,
  Badge,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  SyncOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  ControlOutlined,
} from "@ant-design/icons";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text, Paragraph } = Typography;

const TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

// 默认配置
const DEFAULT_CONFIG = {
  baseUrl: "",
  textPrompt: "一句话回答, 0.111和0.90谁大？",
  imageUrl:
    "https://gips1.baidu.com/it/u=1746086795,2510875842&fm=3028&app=3028&f=JPEG&fmt=auto?w=1024&h=1024",
  imagePrompt: "请简要描述这张图片的主要内容。比如，这张图片是一只狗。",
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
  const messageText =
    payload?.error?.message ||
    payload?.message ||
    error?.message ||
    (status ? `HTTP ${status}` : "请求失败");
  const wrapped = new Error(messageText);
  wrapped.status = status;
  wrapped.payload = payload;
  return wrapped;
};

// 状态样式映射 (UI增强)
const getStatusStyles = (status) => {
  const map = {
    成功: {
      bg: "#f6ffed",
      border: "#b7eb8f",
      color: "#52c41a",
      icon: <CheckCircleFilled />,
    },
    失败: {
      bg: "#fff2f0",
      border: "#ffa39e",
      color: "#ff4d4f",
      icon: <CloseCircleFilled />,
    },
    部分失败: {
      bg: "#fffbe6",
      border: "#ffe58f",
      color: "#faad14",
      icon: <ExclamationCircleFilled />,
    },
    进行中: {
      bg: "#e6f4ff",
      border: "#91caff",
      color: "#1677ff",
      icon: <SyncOutlined spin />,
    },
  };
  return (
    map[status] || {
      bg: "#fafafa",
      border: "#d9d9d9",
      color: "#8c8c8c",
      icon: null,
    }
  );
};

// 子组件：配置输入字段
const ConfigField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  extra,
}) => (
  <>
    <label strong style={{ color: "#262626" }}>
      {label}
    </label>
    {type === "textarea" ? (
      <Input.TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        size="large"
        rows={3}
      />
    ) : (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        size="large"
      />
    )}
    {extra && <div style={{ marginTop: 6, fontSize: 13 }}>{extra}</div>}
  </>
);

// 子组件：可复制标签
const CopyChip = ({ label, value, onCopy, strong = false }) => {
  const displayValue = value || "-";
  return (
    <div
      onClick={() => onCopy(value, label)}
      style={styles.copyChip}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#e6f4ff")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#f5f5f5")}
      title="点击复制"
    >
      <Text type="secondary" strong={strong} style={{ fontSize: 13 }}>
        {label}
      </Text>
      <Text code ellipsis style={{ maxWidth: 200, margin: 0 }}>
        {displayValue}
      </Text>
      <CopyOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
    </div>
  );
};

// 子组件：模型选择器
const ModelSelector = ({ models, selectedModels, onToggle, disabled }) => (
  <div style={styles.selectorBox}>
    {models.length === 0 ? (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无模型，请先拉取。"
        style={{ margin: "24px 0" }}
      />
    ) : (
      <Row gutter={[12, 12]}>
        {models.map((model) => (
          <Col xs={24} sm={12} lg={8} key={model}>
            <Checkbox
              checked={selectedModels.includes(model)}
              disabled={disabled}
              onChange={() => onToggle(model)}
            >
              <span style={{ wordBreak: "break-all" }}>{model}</span>
            </Checkbox>
          </Col>
        ))}
      </Row>
    )}
  </div>
);

// 子组件：测试类型选择器
const TestTypeSelector = ({ selectedTestTypes, onToggle, disabled }) => (
  <div style={{ ...styles.selectorBox, maxHeight: "auto" }}>
    <Row gutter={[16, 16]}>
      {TEST_TYPES.map((item) => (
        <Col span={12} key={item.key}>
          <Checkbox
            checked={selectedTestTypes.includes(item.key)}
            disabled={disabled}
            onChange={() => onToggle(item.key)}
          >
            {item.label}
          </Checkbox>
        </Col>
      ))}
    </Row>
  </div>
);

// 子组件：单个测试用例
const CaseItem = ({ item }) => {
  const meta = getStatusStyles(item.status);
  return (
    <div
      style={{
        ...styles.caseCard,
        border: `1px solid ${meta.border}`,
        backgroundColor: meta.bg,
      }}
    >
      <Row align="middle" justify="space-between" style={{ marginBottom: 8 }}>
        <Col>
          <Space size={10} align="center">
            <span style={{ color: meta.color, fontSize: 16, display: "flex" }}>
              {meta.icon}
            </span>
            <Text strong>{item.testType}</Text>
            <Tag color={meta.color} style={{ margin: 0 }}>
              {item.status}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {item.durationMs} ms
            </Text>
          </Space>
        </Col>
        <Col>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {item.startedAt}
          </Text>
        </Col>
      </Row>

      {item.preview && (
        <div style={styles.previewBox}>
          <Text
            type="secondary"
            style={{ fontSize: 13, marginBottom: 4, display: "block" }}
          >
            输出预览：
          </Text>
          <Paragraph
            ellipsis={{ rows: 2, expandable: true, symbol: "展开" }}
            style={{ margin: 0, fontSize: 13 }}
          >
            {item.preview}
          </Paragraph>
        </div>
      )}

      <Collapse
        ghost
        size="small"
        style={{ marginTop: 8 }}
        items={[
          {
            key: "details",
            label: (
              <Text type="secondary" style={{ fontSize: 13 }}>
                查看请求与响应详情
              </Text>
            ),
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <div style={{ marginBottom: 6 }}>
                    <Text strong style={{ color: "#8c8c8c" }}>
                      请求 (Request)
                    </Text>
                  </div>
                  <pre style={styles.pre}>
                    {JSON.stringify(item.request, null, 2)}
                  </pre>
                </Col>
                <Col xs={24} md={12}>
                  <div style={{ marginBottom: 6 }}>
                    <Text strong style={{ color: "#8c8c8c" }}>
                      响应 (Response)
                    </Text>
                  </div>
                  <pre style={styles.pre}>
                    {JSON.stringify(item.response, null, 2)}
                  </pre>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </div>
  );
};

// 子组件：模型日志卡片
const ModelLogCard = ({ log, onCopy }) => {
  const meta = getStatusStyles(log.status);

  return (
    <Badge.Ribbon text={log.status} color={meta.color}>
      <Card
        size="small"
        style={{
          ...styles.logCard,
          borderColor: log.status === "进行中" ? "#1677ff" : "#f0f0f0",
        }}
        title={
          <Space size={12}>
            <div
              style={{
                width: 4,
                height: 16,
                background: meta.color,
                borderRadius: 2,
              }}
            />
            <Text strong style={{ fontSize: 16 }}>
              {log.model}
            </Text>
            <CopyOutlined
              style={{ color: "#1677ff", cursor: "pointer" }}
              onClick={() => onCopy(log.model, "模型")}
              title="复制模型名称"
            />
          </Space>
        }
      >
        <Space size={16} wrap style={styles.metaRow}>
          <Text type="secondary">
            开始: <Text strong>{log.startedAt}</Text>
          </Text>
          <Text type="secondary">
            耗时: <Text strong>{log.totalDurationMs} ms</Text>
          </Text>
          <Text type="secondary">
            成功:{" "}
            <Text type="success" strong>
              {log.successCount}
            </Text>
          </Text>
          <Text type="secondary">
            失败:{" "}
            <Text type="danger" strong>
              {log.failCount}
            </Text>
          </Text>
        </Space>
        <Divider style={{ margin: "16px 0" }} />
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {log.cases.map((item) => (
            <CaseItem key={item.id} item={item} />
          ))}
        </Space>
      </Card>
    </Badge.Ribbon>
  );
};

// 主组件
const ModelTest = () => {
  const [localUrls, setLocalUrls] = useLocalStorageState("localUrls", {
    defaultValue: [],
  });

  const state = useReactive({
    name: "",
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
    remark: "",
    copyHint: "", // 保持原状：内部状态变量不动，但使用 message 提示用户
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

  const updateModelLog = useMemoizedFn((id, updater) => {
    state.logs = state.logs.map((item) =>
      item.id === id ? updater(item) : item,
    );
  });

  // 复制并唤起交互提示
  const copyText = useMemoizedFn(async (value, label) => {
    if (!value) {
      state.copyHint = `复制失败：${label} 为空`;
      message.warning(state.copyHint);
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
      message.success(state.copyHint);
    } catch {
      state.copyHint = `复制失败：浏览器未授权访问剪贴板`;
      message.error(state.copyHint);
    }
  });

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

  const fetchModels = useMemoizedFn(async () => {
    if (!state.token.trim()) {
      state.summary = "请先填写 API Token。";
      message.warning(state.summary);
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
      message.success(state.summary);
    } catch (error) {
      state.summary = `模型拉取失败：${error.message}`;
      message.error(state.summary);
    } finally {
      state.loadingModels = false;
    }
  });

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
          { role: "user", content: '你好，这是一个连接测试，请回复"连接成功"' },
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

      const hasFunctionCall = result.status === 200;

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

  const runTests = useMemoizedFn(async () => {
    if (!canRun) return;
    const targetModels = [...mergedModels];
    state.running = true;
    state.summary = `开始自动化测试，共 ${targetModels.length} 个模型，每个模型 ${state.selectedTestTypes.length} 项。`;

    try {
      const runners = createTestRunners();
      for (const model of targetModels) {
        await runModelTests(model, runners);
      }
      state.summary = `测试完成，共执行 ${targetModels.length * state.selectedTestTypes.length} 项测试用例。`;
      message.success(state.summary);

      const has = localUrls.find(
        (it) => it.url === state.baseUrl && it.token === state.token,
      );
      if (!has) {
        setLocalUrls([
          ...localUrls,
          {
            name: state.name || "未命名配置",
            url: state.baseUrl,
            token: state.token,
            remark: state.remark,
          },
        ]);
      }
    } catch (e) {
      state.summary = "测试发生异常被中断。";
      message.error(state.summary);
    } finally {
      state.running = false;
    }
  });

  // 操作响应方法
  const toggleModel = useMemoizedFn((modelId) => {
    state.selectedModels = state.selectedModels.includes(modelId)
      ? state.selectedModels.filter((id) => id !== modelId)
      : [...state.selectedModels, modelId];
  });
  const selectAllModels = useMemoizedFn(
    () => (state.selectedModels = [...state.models]),
  );
  const clearModelSelection = useMemoizedFn(() => (state.selectedModels = []));

  const toggleTestType = useMemoizedFn((key) => {
    state.selectedTestTypes = state.selectedTestTypes.includes(key)
      ? state.selectedTestTypes.filter((item) => item !== key)
      : [...state.selectedTestTypes, key];
  });
  const selectAllTestTypes = useMemoizedFn(
    () => (state.selectedTestTypes = TEST_TYPES.map((item) => item.key)),
  );
  const clearTestTypes = useMemoizedFn(() => (state.selectedTestTypes = []));
  const clearLogs = useMemoizedFn(() => (state.logs = []));

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
      {/* 头部导航与全局状态 */}
      <div style={styles.headerRow}>
        <Space size={16} align="center">
          <Link to="/" style={styles.backLink}>
            <ArrowLeftOutlined /> 返回
          </Link>
          <Title
            level={4}
            style={{ margin: 0, fontWeight: 600, color: "#1f1f1f" }}
          >
            模型自动化测试
          </Title>
        </Space>
        {state.summary && (
          <Tag
            color="processing"
            icon={state.running ? <SyncOutlined spin /> : null}
            style={{ fontSize: 13, padding: "4px 10px" }}
          >
            {state.summary}
          </Tag>
        )}
      </div>

      <Spin
        spinning={state.running}
        tip={
          <div style={{ marginTop: 12 }}>
            {state.summary || "正在执行测试..."}
          </div>
        }
        size="large"
      >
        {/* 配置区 */}
        <Card
          title={
            <Space>
              <ThunderboltOutlined style={{ color: "#1677ff" }} />
              <Text strong>连接与配置</Text>
            </Space>
          }
          style={styles.card}
          extra={
            <Space>
              <HistoryOutlined style={{ color: "#8c8c8c" }} />
              <Select
                placeholder="快速加载历史连接"
                style={{ width: 400 }}
                onChange={(val) => {
                  const item = localUrls[val];
                  if (item) {
                    state.name = item.name;
                    state.baseUrl = item.url;
                    state.token = item.token;
                    state.remark = item.remark || "";
                    message.success(`已加载配置：${item.name}`);
                  }
                }}
                options={localUrls.map((it, index) => ({
                  label: `${it.name} (${it.url})`,
                  value: index,
                }))}
              />
            </Space>
          }
        >
          <Row gutter={24}>
            <Col xs={24} md={4}>
              <ConfigField
                label="API Base URL"
                value={state.baseUrl}
                onChange={(v) => (state.baseUrl = v)}
                placeholder="https://api.openai.com/v1"
                extra={
                  <Text type="secondary">
                    自动推导接口：<Text code>{apiRoot || "-"}</Text>
                  </Text>
                }
              />
            </Col>
            <Col xs={24} md={4}>
              <ConfigField
                label="API Token"
                value={state.token}
                onChange={(v) => (state.token = v)}
                placeholder="sk-..."
              />
            </Col>
            <Col xs={24} md={4}>
              <ConfigField
                label="配置名称"
                value={state.name}
                onChange={(v) => (state.name = v)}
                placeholder="例如：OpenAI 生产环境"
              />
            </Col>
            {/* 新增备注列 */}
            <Col xs={24} md={24}>
              <ConfigField
                label="备注"
                value={state.remark}
                type="textarea"
                onChange={(v) => (state.remark = v)}
                placeholder="例如：用于测试 GPT-4o 系列"
              />
              <Button
                type="primary"
                onClick={() => {
                  const newLocalData = localUrls.map((it, ind) => {
                    if (it.url === state.baseUrl && it.token === state.token) {
                      it.remark = state.remark;
                    }
                    return it;
                  });
                  setLocalUrls(newLocalData);
                }}
              >
                保存
              </Button>
            </Col>
          </Row>
          <Space wrap style={{ marginTop: 16 }}>
            <Button
              type="primary"
              ghost
              icon={<ReloadOutlined />}
              onClick={fetchModels}
              loading={state.loadingModels}
              disabled={!state.token.trim() || state.running}
            >
              拉取模型列表
            </Button>
            {state.name && (
              <CopyChip
                label="名称"
                value={state.name.trim()}
                onCopy={copyText}
                strong
              />
            )}
            {state.baseUrl && (
              <CopyChip
                label="Url"
                value={state.baseUrl.trim()}
                onCopy={copyText}
              />
            )}
            {state.token && (
              <CopyChip
                label="Token"
                value={state.token.trim()}
                onCopy={copyText}
              />
            )}
            {mergedModels.slice(0, 3).map((model) => (
              <CopyChip
                key={model}
                label="模型"
                value={model}
                onCopy={copyText}
              />
            ))}
            {mergedModels.length > 3 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                等 {mergedModels.length} 个...
              </Text>
            )}
          </Space>
        </Card>

        {/* 测试参数区 */}
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <AppstoreOutlined style={{ color: "#1677ff" }} />
                  <Text strong>1. 选择目标模型</Text>
                </Space>
              }
              style={{ ...styles.card, height: "100%" }}
            >
              <div style={{ marginBottom: 16 }}>
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 6 }}
                >
                  补充或手动指定模型（逗号分割，可多填）
                </Text>
                <Input
                  value={state.manualModelsText}
                  onChange={(e) => (state.manualModelsText = e.target.value)}
                  placeholder="例如：gpt-4o, o3-mini"
                  disabled={state.running}
                />
              </div>
              <Space
                style={{
                  marginBottom: 12,
                  width: "100%",
                  justifyContent: "space-between",
                }}
                wrap
              >
                <Space>
                  <Button
                    size="small"
                    onClick={selectAllModels}
                    disabled={state.models.length === 0 || state.running}
                  >
                    全选下拉
                  </Button>
                  <Button
                    size="small"
                    onClick={clearModelSelection}
                    disabled={
                      state.selectedModels.length === 0 || state.running
                    }
                  >
                    清空列表选择
                  </Button>
                </Space>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  列表勾选:{" "}
                  <Text strong color="blue">
                    {state.selectedModels.length}
                  </Text>{" "}
                  / 手动补充: <Text strong>{manualModels.length}</Text> /
                  去重总计:{" "}
                  <Text strong color="blue">
                    {mergedModels.length}
                  </Text>
                </Text>
              </Space>
              <ModelSelector
                models={state.models}
                selectedModels={state.selectedModels}
                onToggle={toggleModel}
                disabled={state.running}
              />
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              title={
                <Space>
                  <ControlOutlined style={{ color: "#1677ff" }} />
                  <Text strong>2. 选择测试能力与执行</Text>
                </Space>
              }
              style={{ ...styles.card, height: "100%" }}
            >
              <Space
                style={{
                  marginBottom: 12,
                  width: "100%",
                  justifyContent: "space-between",
                }}
                wrap
              >
                <Space>
                  <Button
                    size="small"
                    onClick={selectAllTestTypes}
                    disabled={
                      state.selectedTestTypes.length === TEST_TYPES.length ||
                      state.running
                    }
                  >
                    全选能力
                  </Button>
                  <Button
                    size="small"
                    onClick={clearTestTypes}
                    disabled={
                      state.selectedTestTypes.length === 0 || state.running
                    }
                  >
                    清空选择
                  </Button>
                </Space>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  已选:{" "}
                  <Text strong color="blue">
                    {state.selectedTestTypes.length}
                  </Text>
                </Text>
              </Space>
              <TestTypeSelector
                selectedTestTypes={state.selectedTestTypes}
                onToggle={toggleTestType}
                disabled={state.running}
              />

              <div style={styles.actionReadyBox}>
                <Space direction="vertical" style={{ width: "100%" }} size={2}>
                  <Text strong style={{ color: "#0958d9", fontSize: 16 }}>
                    准备就绪
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    系统将依次调用 {mergedModels.length} 个模型，共计发出{" "}
                    {mergedModels.length * state.selectedTestTypes.length}{" "}
                    次测试请求。
                  </Text>
                </Space>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<PlayCircleOutlined />}
                  onClick={runTests}
                  disabled={!canRun}
                  loading={state.running}
                  style={{ marginTop: 16, height: 48, fontSize: 16 }}
                >
                  开始自动化测试
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 日志区 */}
        <Card
          title="执行日志记录"
          style={{ ...styles.card, marginTop: 24 }}
          extra={
            <Space>
              <Button
                icon={<DeleteOutlined />}
                onClick={clearLogs}
                disabled={state.running || state.logs.length === 0}
              >
                清空列表
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportLogs}
                disabled={state.logs.length === 0}
              >
                导出 JSON 报告
              </Button>
            </Space>
          }
        >
          {state.logs.length === 0 ? (
            <Empty description="暂无测试日志。" style={{ margin: "40px 0" }} />
          ) : (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              {state.logs.map((log) => (
                <ModelLogCard key={log.id} log={log} onCopy={copyText} />
              ))}
            </Space>
          )}
        </Card>
      </Spin>
    </div>
  );
};

const styles = {
  page: {
    margin: "0 auto",
    padding: "24px 32px",
    background: "#f5f7fa",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backLink: {
    color: "#595959",
    fontSize: 15,
    textDecoration: "none",
    transition: "color 0.2s",
  },
  card: {
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  copyChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    background: "#f5f5f5",
    borderRadius: 6,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  selectorBox: {
    border: "1px solid #e8e8e8",
    borderRadius: 8,
    padding: 16,
    maxHeight: 240,
    overflow: "auto",
    background: "#fafafa",
  },
  actionReadyBox: {
    marginTop: 20,
    padding: 20,
    background: "#f0f5ff",
    borderRadius: 10,
    border: "1px solid #adc6ff",
  },
  logCard: {
    borderRadius: 10,
    boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
    overflow: "hidden",
  },
  metaRow: {
    padding: "10px 16px",
    background: "#fafafa",
    borderRadius: 6,
    width: "100%",
  },
  caseCard: {
    borderRadius: 8,
    padding: "12px 16px",
  },
  previewBox: {
    marginTop: 8,
    padding: "8px 12px",
    background: "rgba(255,255,255,0.6)",
    borderRadius: 6,
  },
  pre: {
    margin: 0,
    maxHeight: 300,
    overflow: "auto",
    background: "#0d1117",
    color: "#c9d1d9",
    borderRadius: 8,
    padding: 16,
    fontSize: 13,
    fontFamily:
      "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
    lineHeight: 1.5,
  },
};

export default ModelTest;
