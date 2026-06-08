const REQUEST_TIMEOUT = 15 * 1000;
export const REQUEST_TIMEOUT_MESSAGE = `请求超时，已停止请求（${REQUEST_TIMEOUT / 1000}s）`;
const MAX_OUTPUT_LENGTH = 160;
export const DEFAULT_CHECKS = ['text', 'codex'];
export const checkOptions = [
  { label: '文本能力', value: 'text' },
  { label: 'Codex', value: 'codex' },
  { label: 'Claude', value: 'claude' },
];
export const statusMap = {
  loading: { color: 'processing', text: '检测中' },
  success: { color: 'green', text: '成功' },
  failed: { color: 'red', text: '失败' },
};
export const checkNameMap = checkOptions.reduce((map, option) => {
  map[option.value] = option.label;
  return map;
}, {});
// 规范化接口地址
export const normalizeBaseUrl = (url) => url.trim().replace(/\/+$/, '');
// 拼接接口路径
const buildApiUrl = (baseUrl, path) => `${normalizeBaseUrl(baseUrl)}${path}`;
// 判断超时错误
const isTimeoutError = (error) => error?.name === 'AbortError' || error?.message === REQUEST_TIMEOUT_MESSAGE;
// 脱敏令牌文本
export const maskToken = (token) => {
  const trimmedToken = token.trim();
  // 短令牌边界
  if (trimmedToken.length <= 12) {
    return trimmedToken ? '******' : '';
  }
  return `${trimmedToken.slice(0, 6)}...${trimmedToken.slice(-4)}`;
};
// 截断结果摘要
const summarizeText = (text) => {
  const normalizedText = String(text || '').replace(/\s+/g, ' ').trim();
  // 长文本边界
  if (normalizedText.length <= MAX_OUTPUT_LENGTH) {
    return normalizedText;
  }
  return `${normalizedText.slice(0, MAX_OUTPUT_LENGTH)}...`;
};
// 提取模型列表
const parseModelOptions = (payload) => {
  const modelList = Array.isArray(payload?.data) ? payload.data : [];
  return modelList
    .filter((model) => model?.id)
    .map((model) => ({ label: model.id, value: model.id }));
};
// 读取错误信息
const parseErrorMessage = async (response) => {
  const text = await response.text();
  // 空响应边界
  if (!text) {
    return `${response.status} ${response.statusText}`;
  }
  try {
    const payload = JSON.parse(text);
    return payload?.error?.message || payload?.message || summarizeText(text);
  } catch (error) {
    return summarizeText(text);
  }
};
// 发送 JSON 请求
const requestJson = async ({ baseUrl, token, path, body, method = 'POST' }) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(new Error(REQUEST_TIMEOUT_MESSAGE)), REQUEST_TIMEOUT);
  try {
    const response = await fetch(buildApiUrl(baseUrl, path), {
      method,
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    // 失败响应边界
    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response);
      throw new Error(errorMessage);
    }
    return response.json();
  } catch (error) {
    // 超时边界
    if (isTimeoutError(error)) {
      throw new Error(REQUEST_TIMEOUT_MESSAGE);
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
};
// 发送流式请求
const requestStream = async ({ baseUrl, token, body }) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(new Error(REQUEST_TIMEOUT_MESSAGE)), REQUEST_TIMEOUT);
  try {
    const response = await fetch(buildApiUrl(baseUrl, '/v1/chat/completions'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    // 失败响应边界
    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response);
      throw new Error(errorMessage);
    }
    const reader = response.body?.getReader();
    // 流读取边界
    if (!reader) {
      throw new Error('浏览器无法读取流式响应');
    }
    const summary = await readStreamSummary(reader);
    await reader.cancel();
    return summary;
  } catch (error) {
    // 超时边界
    if (isTimeoutError(error)) {
      throw new Error(REQUEST_TIMEOUT_MESSAGE);
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
};
// 读取流式摘要
const readStreamSummary = async (reader) => {
  const decoder = new TextDecoder();
  let streamText = '';
  while (true) {
    const { done, value } = await reader.read();
    // 流结束边界
    if (done) {
      break;
    }
    streamText += decoder.decode(value, { stream: true });
    // 首包边界
    if (streamText.includes('data:')) {
      break;
    }
  }
  return summarizeText(streamText || '已收到流式响应');
};
// 拉取模型列表
export const fetchModelOptions = async ({ baseUrl, token }) => {
  const payload = await requestJson({ baseUrl, token, path: '/v1/models', method: 'GET' });
  return parseModelOptions(payload);
};
// 创建聊天请求体
const createChatBody = ({ model, prompt, extraBody = {} }) => ({
  model,
  messages: [
    { role: 'system', content: '你正在处理企业内部集成联调记录，请保持输出简短、稳定、低敏。' },
    { role: 'user', content: prompt },
  ],
  temperature: 0,
  ...extraBody,
});
// 创建工具请求体
const createToolBody = (model) =>
  createChatBody({
    model,
    prompt: '在内部工具编排示例中，请调用可用函数 echo_probe，参数 text 固定为 tool-ok。',
    extraBody: {
      tools: [
        {
          type: 'function',
          function: {
            name: 'echo_probe',
            description: '返回固定联调文本。',
            parameters: {
              type: 'object',
              properties: { text: { type: 'string' } },
              required: ['text'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'echo_probe' } },
    },
  });
// 创建响应请求体
const createResponsesBody = (model) => ({
  model,
  input: '企业知识库联调记录：请返回一句简短状态文案，内容为“Responses API 正常”。',
  temperature: 0,
});
// 提取聊天摘要
const parseChatSummary = (payload) => {
  const content = payload?.choices?.[0]?.message?.content;
  // 内容数组边界
  if (Array.isArray(content)) {
    return summarizeText(content.map((item) => item?.text || item?.content || '').join(''));
  }
  return summarizeText(content || JSON.stringify(payload));
};
// 提取工具摘要
const parseToolSummary = (payload) => {
  const toolCalls = payload?.choices?.[0]?.message?.tool_calls;
  // 工具调用边界
  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    return `工具调用正常：${toolCalls[0]?.function?.name || 'unknown'}`;
  }
  throw new Error('未返回 tool_calls');
};
// 提取响应摘要
const parseResponsesSummary = (payload) => {
  const directText = payload?.output_text;
  // 直接文本边界
  if (directText) {
    return summarizeText(directText);
  }
  const output = Array.isArray(payload?.output) ? payload.output : [];
  const text = output
    .flatMap((item) => item?.content || [])
    .map((content) => content?.text || '')
    .join('');
  return summarizeText(text || JSON.stringify(payload));
};
// 执行子探针
const runSubProbe = async (name, task) => {
  try {
    const summary = await task();
    return { name, status: 'success', summary };
  } catch (error) {
    // 超时边界
    if (isTimeoutError(error)) {
      throw error;
    }
    return { name, status: 'failed', summary: error?.message || '检测失败' };
  }
};
// 汇总子探针
const mergeSubProbeResults = (results) => {
  const failedResult = results.find((result) => result.status === 'failed');
  const summary = results.map((result) => `${result.name}${result.status === 'success' ? '✓' : `✗ ${result.summary}`}`).join(' ｜ ');
  // 失败汇总边界
  if (failedResult) {
    return { status: 'failed', summary };
  }
  return { status: 'success', summary };
};
// 执行文本能力探针
const runTextProbe = async ({ baseUrl, token, model }) => {
  const results = [];
  const chatBody = createChatBody({ model, prompt: '企业知识库联调记录：请返回一句简短状态文案，内容为“文本能力正常”。' });
  const jsonBody = createChatBody({
    model,
    prompt: '企业配置回执场景：请返回 JSON 对象，字段固定为 {"status":"ok","ability":"json"}。',
    extraBody: { response_format: { type: 'json_object' } },
  });
  const streamBody = createChatBody({
    model,
    prompt: '实时消息预览场景：请返回一句简短状态文案，内容为“流式能力正常”。',
    extraBody: { stream: true },
  });
  results.push(await runSubProbe('Chat', () => requestJson({ baseUrl, token, path: '/v1/chat/completions', body: chatBody }).then(parseChatSummary)));
  results.push(await runSubProbe('流式', () => requestStream({ baseUrl, token, body: streamBody })));
  results.push(await runSubProbe('JSON', () => requestJson({ baseUrl, token, path: '/v1/chat/completions', body: jsonBody }).then(parseChatSummary)));
  results.push(await runSubProbe('工具', () => requestJson({ baseUrl, token, path: '/v1/chat/completions', body: createToolBody(model) }).then(parseToolSummary)));
  results.push(await runSubProbe('Responses', () => requestJson({ baseUrl, token, path: '/v1/responses', body: createResponsesBody(model) }).then(parseResponsesSummary)));
  return mergeSubProbeResults(results);
};
// 执行聊天探针
const runChatProbe = async ({ baseUrl, token, model, prompt }) => {
  const payload = await requestJson({
    baseUrl,
    token,
    path: '/v1/chat/completions',
    body: createChatBody({ model, prompt }),
  });
  return { status: 'success', summary: parseChatSummary(payload) };
};
// 执行单个探针
const runProbe = async ({ baseUrl, token, model, checkType }) => {
  const startedAt = performance.now();
  try {
    const result = await requestProbeResult({ baseUrl, token, model, checkType });
    const duration = Math.round(performance.now() - startedAt);
    return { duration, ...result };
  } catch (error) {
    const duration = Math.round(performance.now() - startedAt);
    return { status: 'failed', duration, summary: error?.message || '检测失败', isTimedOut: isTimeoutError(error) };
  }
};
// 请求探针结果
const requestProbeResult = ({ baseUrl, token, model, checkType }) => {
  // 文本探针边界
  if (checkType === 'text') {
    return runTextProbe({ baseUrl, token, model });
  }
  // Codex 探针边界
  if (checkType === 'codex') {
    return runChatProbe({
      baseUrl,
      token,
      model,
      prompt: '你是代码助手工作台。请用三行输出：计划、文件、验证，内容模拟一次最小代码修改。',
    });
  }
  return runChatProbe({
    baseUrl,
    token,
    model,
    prompt: '你是命令行代码助手。请用中文返回 Plan、Patch、Verify 三段，保持简短。',
  });
};
// 生成模型检测组
const createProbeGroups = ({ selectedModels, selectedChecks }) =>
  selectedModels.map((model) => selectedChecks.map((checkType) => ({ model, checkType })));
// 创建检测结果
const buildProbeResult = ({ baseUrl, token, stationName, remark, job, result }) => ({
  id: `${Date.now()}-${job.model}-${job.checkType}`,
  stationName,
  remark,
  baseUrl: normalizeBaseUrl(baseUrl),
  token,
  model: job.model,
  checkType: job.checkType,
  ...result,
});
// 执行模型检测组
const runProbeGroup = async ({ baseUrl, token, stationName, remark, jobs, shouldStop, onResult }) => {
  const resultList = await Promise.all(
    jobs.map(async (job) => {
      const result = await runProbe({ baseUrl, token, model: job.model, checkType: job.checkType });
      const probeResult = buildProbeResult({ baseUrl, token, stationName, remark, job, result });
      // 重置停止边界
      if (shouldStop?.()) {
        return null;
      }
      onResult(probeResult);
      return probeResult;
    }),
  );
  return resultList.filter(Boolean);
};
// 执行全部探针
export const runProbeJobs = async ({ baseUrl, token, stationName, remark, selectedModels, selectedChecks, shouldStop, onResult }) => {
  const groups = createProbeGroups({ selectedModels, selectedChecks });
  let finishedCount = 0;
  for (const jobs of groups) {
    // 重置停止边界
    if (shouldStop?.()) {
      return finishedCount;
    }
    const resultList = await runProbeGroup({ baseUrl, token, stationName, remark, jobs, shouldStop, onResult });
    finishedCount += resultList.length;
    const hasTimedOut = resultList.some((result) => result.isTimedOut);
    // 超时停止边界
    if (hasTimedOut) {
      return finishedCount;
    }
  }
  return finishedCount;
};
