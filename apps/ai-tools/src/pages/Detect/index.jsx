import { useRef } from 'react';
import { Button, Card, Col, Empty, Input, Modal, Popconfirm, Radio, Row, Space, Table, Tag, Typography, message } from 'antd';
import { useMemoizedFn, useReactive, useRequest } from 'ahooks';
import {
  DEFAULT_CHECK,
  checkNameMap,
  checkOptions,
  fetchModelOptions,
  maskToken,
  normalizeBaseUrl,
} from './probeUtils';
import styles from './index.module.less';

const HISTORY_STORAGE_KEY = 'ai-tools-detect-history';
const SHELL_SINGLE_QUOTE_ESCAPE = "'\\''";
const CURL_CODE_MIN_ROWS = 24;
const MODEL_CATEGORIES = [
  { label: '全部', value: 'all' },
  { label: 'GPT', value: 'gpt' },
  { label: 'Claude', value: 'claude' },
  { label: 'Gemini', value: 'gemini' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'Qwen', value: 'qwen' },
  { label: '其他', value: 'other' },
];
const clickableTextStyle = { cursor: 'pointer' };

// 下载 JSON 文件
const downloadJsonFile = (name, content) => {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

// 创建历史 ID
const createHistoryId = (baseUrl, token) => `${normalizeBaseUrl(baseUrl)}-${token.trim()}`;

// 读取历史列表
const readHistoryList = () => {
  try {
    const text = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    const list = JSON.parse(text || '[]');
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
};

// 写入历史列表
const writeHistoryList = (list) => {
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
};

// 创建历史记录
const buildHistoryRecord = (state) => {
  const nowText = new Date().toLocaleString();
  const baseUrl = normalizeBaseUrl(state.baseUrl);
  const token = state.token.trim();

  return {
    id: createHistoryId(baseUrl, token),
    stationName: state.stationName.trim() || '未命名',
    remark: state.remark.trim(),
    baseUrl,
    token,
    updatedAt: nowText,
  };
};

// 规范历史记录
const normalizeHistoryRecord = (record) => {
  const baseUrl = normalizeBaseUrl(String(record?.baseUrl || ''));
  const token = String(record?.token || '').trim();

  return {
    id: createHistoryId(baseUrl, token),
    stationName: String(record?.stationName || '未命名'),
    remark: String(record?.remark || ''),
    baseUrl,
    token,
    updatedAt: String(record?.updatedAt || new Date().toLocaleString()),
  };
};

// 校验历史记录
const isValidHistoryRecord = (record) => Boolean(record?.baseUrl && record?.token);

// 更新历史列表
const upsertHistoryRecord = (list, record) => {
  const nextList = list.filter((item) => item.id !== record.id);
  return [record, ...nextList];
};

// 合并历史列表
const mergeHistoryList = (currentList, importList) =>
  importList.reduce((list, record) => upsertHistoryRecord(list, record), currentList);

// 筛选历史列表
const filterHistoryList = (list, keyword) => {
  const query = keyword.trim().toLowerCase();
  // 空搜索边界
  if (!query) {
    return list;
  }
  return list.filter((item) => {
    const text = [item.stationName, item.remark, item.baseUrl, item.token].join(' ').toLowerCase();
    return text.includes(query);
  });
};

// 复制文本
const copyText = async (text) => {
  await navigator.clipboard.writeText(text || '');
  message.success('已复制');
};

// 可点文本
const CopyText = ({ text, masked, width, className }) => {
  const displayText = masked ? maskToken(text || '') : text;
  const textStyle = width ? { ...clickableTextStyle, maxWidth: width } : clickableTextStyle;
  const handleCopy = useMemoizedFn(() => copyText(text));

  return (
    <Typography.Text className={className} ellipsis style={textStyle} title={displayText || '-'} onClick={handleCopy}>
      {displayText || '-'}
    </Typography.Text>
  );
};

// 复制信息块
const CopyChip = ({ label, text, masked, width }) => (
  <span className={styles.copyChip}>
    <span className={styles.copyLabel}>{label}</span>
    <CopyText text={text} masked={masked} width={width} className={styles.copyValue} />
  </span>
);

// curl 代码块
const CurlCodeBlock = ({ code }) => {
  const handleCopy = useMemoizedFn(() => copyText(code));

  return (
    <Space direction="vertical" size={8} className={styles.fullWidth}>
      <Input.TextArea
        readOnly
        value={code}
        rows={CURL_CODE_MIN_ROWS}
        className={styles.curlCode}
      />
      <Button onClick={handleCopy}>复制 curl</Button>
    </Space>
  );
};

// 转义 shell 文本
const escapeShellText = (text) => String(text).replace(/'/g, SHELL_SINGLE_QUOTE_ESCAPE);

// 包装 shell 文本
const quoteShellText = (text) => `'${escapeShellText(text)}'`;

// 创建接口地址
const buildCurlUrl = (baseUrl, path) => `${normalizeBaseUrl(baseUrl)}${path}`;

// 创建对话载荷
const createChatCurlBody = (model) => ({
  model,
  messages: [
    { role: 'user', content: '用一句话回答,0.11和0.9谁大？' },
  ],
  temperature: 0,
});

// 创建 Codex 载荷
const createCodexCurlBody = (model) => ({
  model,
  input: '你是 Codex CLI。请用三行输出：计划、文件、验证，内容模拟一次最小代码修改。',
  temperature: 0,
});

// 创建 Claude 载荷
const createClaudeCurlBody = (model) => ({
  model,
  max_tokens: 256,
  system: '你正在处理 Claude Code 请求，请保持输出简短、稳定、低敏。',
  messages: [{ role: 'user', content: '请用中文返回 Plan、Patch、Verify 三段，保持简短。' }],
});

// 创建 curl 规格
const createCurlSpec = ({ model, checkType }) => {
  // Codex 边界
  if (checkType === 'codex') {
    return { path: '/v1/responses', body: createCodexCurlBody(model), authType: 'bearer' };
  }
  // Claude 边界
  if (checkType === 'claude') {
    return { path: '/v1/messages', body: createClaudeCurlBody(model), authType: 'anthropic' };
  }
  return { path: '/v1/chat/completions', body: createChatCurlBody(model), authType: 'bearer' };
};

// 创建 curl 请求头
const createCurlHeaders = ({ token, authType }) => {
  // Claude 认证边界
  if (authType === 'anthropic') {
    return [
      { name: 'x-api-key', value: token.trim() },
      { name: 'anthropic-version', value: '2023-06-01' },
      { name: 'content-type', value: 'application/json' },
    ];
  }
  return [
    { name: 'Authorization', value: `Bearer ${token.trim()}` },
    { name: 'Content-Type', value: 'application/json' },
  ];
};

// 创建 header 行
const buildHeaderLines = (headers) => headers.map((header) => `  -H ${quoteShellText(`${header.name}: ${header.value}`)} \\`);

// 创建 curl 命令
const buildCurlCode = ({ baseUrl, token, model, checkType }) => {
  const spec = createCurlSpec({ model, checkType });
  const headers = createCurlHeaders({ token, authType: spec.authType });
  const body = JSON.stringify(spec.body, null, 2);

  return [
    `curl  -sS  ${quoteShellText(buildCurlUrl(baseUrl, spec.path))} \\`,
    '  -X POST \\',
    ...buildHeaderLines(headers),
    `  -d ${quoteShellText(body)}`,
  ].join('\n');
};

// 获取模型分类
const getModelCategory = (modelId) => {
  const lowerModelId = modelId.toLowerCase();
  // GPT 分类
  if (lowerModelId.includes('gpt') || lowerModelId.includes('openai')) {
    return 'gpt';
  }
  // Claude 分类
  if (lowerModelId.includes('claude')) {
    return 'claude';
  }
  // Gemini 分类
  if (lowerModelId.includes('gemini')) {
    return 'gemini';
  }
  // DeepSeek 分类
  if (lowerModelId.includes('deepseek')) {
    return 'deepseek';
  }
  // Qwen 分类
  if (lowerModelId.includes('qwen') || lowerModelId.includes('qwq')) {
    return 'qwen';
  }
  return 'other';
};

// 筛选模型列表
const filterModels = (modelOptions, category) => {
  // 全部分类边界
  if (category === 'all') {
    return modelOptions;
  }
  return modelOptions.filter((model) => getModelCategory(model.value) === category);
};

// 统计模型分类
const countModels = (modelOptions, category) => filterModels(modelOptions, category).length;

// 判断是否选中
const isModelSelected = (selectedModels, modelId) => selectedModels.includes(modelId);

// 创建模型选项
const createModelOption = (modelId) => ({ label: modelId, value: modelId });

// 解析手动模型
const parseManualModelIds = (text) => {
  const modelIds = text
    .split(',')
    .map((modelId) => modelId.trim())
    .filter(Boolean);
  return Array.from(new Set(modelIds));
};

// 合并模型选项
const mergeModelOptions = (modelOptions, modelIds) => {
  const modelValueSet = new Set(modelOptions.map((model) => model.value));
  const manualOptions = modelIds.filter((modelId) => !modelValueSet.has(modelId)).map(createModelOption);
  return [...modelOptions, ...manualOptions];
};

// 合并检测模型
const mergeSelectedModels = (selectedModels, modelIds) => Array.from(new Set([...selectedModels, ...modelIds]));

// 创建结果 ID
const createResultId = (requestId, model, checkType) => `${requestId}-${model}-${checkType}`;

// 创建脚本结果
const buildCurlResult = ({ baseUrl, token, stationName, remark, requestId, model, checkType }) => ({
  id: createResultId(requestId, model, checkType),
  stationName,
  remark,
  baseUrl: normalizeBaseUrl(baseUrl),
  token,
  model,
  checkType,
  curlCode: buildCurlCode({ baseUrl, token, model, checkType }),
});

// 创建脚本列表
const buildCurlResults = ({ baseUrl, token, stationName, remark, requestId, selectedModels, selectedChecks }) =>
  selectedModels.flatMap((model) =>
    selectedChecks.map((checkType) => buildCurlResult({ baseUrl, token, stationName, remark, requestId, model, checkType })),
  );

// 分类按钮
const ModelCategoryButton = ({ item, modelOptions, category, onCategoryChange }) => {
  const count = countModels(modelOptions, item.value);
  const type = category === item.value ? 'primary' : 'default';
  const handleClick = useMemoizedFn(() => onCategoryChange(item.value));

  return (
    <Button type={type} onClick={handleClick}>
      {item.label}({count})
    </Button>
  );
};

// 模型分类栏
const ModelCategoryTabs = ({ modelOptions, category, onCategoryChange }) => {
  const renderCategory = useMemoizedFn((item) => (
    <ModelCategoryButton
      key={item.value}
      item={item}
      modelOptions={modelOptions}
      category={category}
      onCategoryChange={onCategoryChange}
    />
  ));

  return <div className={styles.categoryList}>{MODEL_CATEGORIES.map(renderCategory)}</div>;
};

// 模型标签项
const ModelCheckItem = ({ model, checked, onToggle }) => {
  const handleToggle = useMemoizedFn(() => onToggle(model.value));

  return (
    <Tag.CheckableTag className={styles.modelTag} checked={checked} onChange={handleToggle}>
      {model.label}
    </Tag.CheckableTag>
  );
};

// 模型选择器
const ModelPicker = ({ state, onFieldChange }) => {
  const visibleModels = filterModels(state.modelOptions, state.modelCategory);
  const selectedVisibleModels = visibleModels.filter((model) => isModelSelected(state.selectedModels, model.value));
  const isAllVisibleSelected = visibleModels.length > 0 && selectedVisibleModels.length === visibleModels.length;

  // 切换分类
  const handleCategoryChange = useMemoizedFn((category) => onFieldChange('modelCategory', category));

  // 切换单个模型
  const handleToggleModel = useMemoizedFn((modelId) => {
    // 取消选择边界
    if (isModelSelected(state.selectedModels, modelId)) {
      onFieldChange(
        'selectedModels',
        state.selectedModels.filter((selectedModel) => selectedModel !== modelId),
      );
      return;
    }
    onFieldChange('selectedModels', [...state.selectedModels, modelId]);
  });

  // 全选当前分类
  const handleSelectVisible = useMemoizedFn(() => {
    const visibleModelIds = visibleModels.map((model) => model.value);
    const selectedModelSet = new Set([...state.selectedModels, ...visibleModelIds]);
    onFieldChange('selectedModels', Array.from(selectedModelSet));
  });

  // 清空当前分类
  const handleClearVisible = useMemoizedFn(() => {
    const visibleModelIds = visibleModels.map((model) => model.value);
    onFieldChange(
      'selectedModels',
      state.selectedModels.filter((modelId) => !visibleModelIds.includes(modelId)),
    );
  });

  // 渲染模型项
  const renderModel = useMemoizedFn((model) => (
    <ModelCheckItem
      key={model.value}
      model={model}
      checked={isModelSelected(state.selectedModels, model.value)}
      onToggle={handleToggleModel}
    />
  ));

  // 空模型边界
  if (state.modelOptions.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无模型" />;
  }

  return (
    <div className={styles.modelPicker}>
      <div className={styles.modelToolbar}>
        <ModelCategoryTabs modelOptions={state.modelOptions} category={state.modelCategory} onCategoryChange={handleCategoryChange} />
        <div className={styles.modelActions}>
          <Button size="" type={isAllVisibleSelected ? 'primary' : 'default'} onClick={handleSelectVisible}>
            全选({visibleModels.length})
          </Button>
          <Button size="" onClick={handleClearVisible}>
            清空
          </Button>
          <Typography.Text type="secondary">已选 {state.selectedModels.length}</Typography.Text>
        </div>
      </div>
      <div className={styles.modelGrid}>{visibleModels.map(renderModel)}</div>
    </div>
  );
};

// 页面标题栏
const PageHeader = ({ onOpenHistory }) => (
  <div className={styles.pageHeader}>
    <Typography.Title level={5} className={styles.pageTitle}>
      AI 中转站检测台
    </Typography.Title>
    <Button onClick={onOpenHistory}>历史记录</Button>
  </div>
);

// 历史弹窗
const HistoryDeleteButton = ({ record, onDelete }) => {
  // 删除历史
  const handleDelete = useMemoizedFn(() => onDelete(record.id));

  return (
    <Popconfirm title="确认删除该历史记录？" onConfirm={handleDelete}>
      <Button danger size="small">
        删除
      </Button>
    </Popconfirm>
  );
};

// 历史弹窗
const HistoryModal = ({ state, onKeywordChange, onImport, onExport, onSelect, onSave, onDelete, onCancel, onOk }) => {
  const fileRef = useRef(null);
  const visibleList = filterHistoryList(state.historyList, state.historyKeyword);

  // 搜索历史
  const handleKeywordChange = useMemoizedFn((event) => onKeywordChange(event.target.value));


  // 触发导入
  const handleImportClick = useMemoizedFn(() => fileRef.current?.click());

  // 导入历史
  const handleImportChange = useMemoizedFn((event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    // 文件边界
    if (!file) {
      return;
    }
    onImport(file);
  });

  // 导出历史
  const handleExport = useMemoizedFn(() => onExport());

  // 确认选择
  const handleOk = useMemoizedFn(() => onOk());

  // 关闭弹窗
  const handleCancel = useMemoizedFn(() => onCancel());

  // 渲染历史名称
  const renderName = useMemoizedFn((text) => <Typography.Text ellipsis>{text || '-'}</Typography.Text>);

  // 渲染历史 URL
  const renderUrl = useMemoizedFn((text) => <CopyText text={text} width={240} />);

  // 渲染历史令牌
  const renderToken = useMemoizedFn((text) => <CopyText text={text} masked width={130} />);

  // 渲染历史操作
  const renderAction = useMemoizedFn((_, record) => <HistoryDeleteButton record={record} onDelete={onDelete} />);

  const columns = [
    {
      title: '名称',
      dataIndex: 'stationName',
      width: 80,
    },
    {
      title: 'URL',
      dataIndex: 'baseUrl',
      width: 200,
    },
    {
      title: 'Token',
      dataIndex: 'token',
      width: 200,
    },
    {
      title: '备注',
      dataIndex: 'remark',
    },
    {
      title: '操作',
      dataIndex: 'id',
      width: 90,
      render: renderAction,
    },
  ];
  const selectedHistoryIds = state.selectedHistoryId ? [state.selectedHistoryId] : [];
  const rowSelection = {
    type: 'radio',
    selectedRowKeys: selectedHistoryIds,
    onChange: onSelect,
  };

  return (
    <Modal
      title="历史记录"
      open={state.historyOpen}
      width={'65%'}
      okText="确定"
      cancelText="取消"
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Space direction="vertical" size={12} className={styles.fullWidth}>
        <div className={styles.historyToolbar}>
          <Input.Search allowClear placeholder="搜索名称、备注、URL 或 Token" value={state.historyKeyword} onChange={handleKeywordChange} />
          <Space wrap>
            <Button onClick={handleImportClick}>导入 JSON</Button>
            <Button onClick={handleExport}>导出 JSON</Button>
          </Space>
          <input ref={fileRef} type="file" accept="application/json,.json" className={styles.hiddenFile} onChange={handleImportChange} />
        </div>
        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={visibleList}
          rowSelection={rowSelection}
          pagination={{ pageSize: 6 }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无历史" /> }}
          scroll={{
            y: '480px'
          }}
        />
      </Space>
    </Modal>
  );
};

// 配置面板
const ConfigPanel = ({ state, loading, onFieldChange, onFetchModels }) => {
  const handleNameChange = useMemoizedFn((event) => onFieldChange('stationName', event.target.value));
  const handleRemarkChange = useMemoizedFn((event) => onFieldChange('remark', event.target.value));
  const handleUrlChange = useMemoizedFn((event) => onFieldChange('baseUrl', event.target.value));
  const handleTokenChange = useMemoizedFn((event) => onFieldChange('token', event.target.value));

  return (
    <Card bordered={false} className={styles.panelCard}>
      <Space direction="vertical" size={10} className={styles.fullWidth}>
        <Row gutter={[10, 10]}>
          <Col md={6}>
            <div className={styles.fieldBlock}>
              <Typography.Text strong className={styles.label}>名称</Typography.Text>
              <Input size="large" value={state.stationName} onChange={handleNameChange} />
            </div>
          </Col>
          <Col md={18}>
            <div className={styles.fieldBlock}>
              <Typography.Text strong className={styles.label}>备注</Typography.Text>
              <Input size="large" value={state.remark} onChange={handleRemarkChange} />
            </div>
          </Col>
        </Row>
        <div className={styles.fieldBlock}>
          <Typography.Text strong className={styles.label}>URL</Typography.Text>
          <Input size="large" value={state.baseUrl} onChange={handleUrlChange} />
        </div>
        <div className={styles.fieldBlock}>
          <Typography.Text strong className={styles.label}>Token</Typography.Text>
          <Input size="large" value={state.token} onChange={handleTokenChange} />
        </div>
        <div className={styles.fetchBar}>
          <Button type="primary" loading={loading} onClick={onFetchModels}>
            拉取模型
          </Button>
          <Typography.Text type="secondary">{state.modelOptions.length} 个模型</Typography.Text>
        </div>
      </Space>
    </Card>
  );
};

// 手动模型输入
const ManualModelInput = ({ value, onChange, onAdd }) => {
  const handleTextChange = useMemoizedFn((event) => onChange(event.target.value));

  return (
    <div className={styles.manualModelBox}>
      <div className={styles.manualModelHeader}>
        <div>
          <Typography.Text strong>手动模型 ID</Typography.Text>
          <Typography.Text type="secondary" className={styles.manualModelHint}>
            英文逗号分割，适用于不支持 /v1/models 的站点
          </Typography.Text>
        </div>
        <Button type="primary" onClick={onAdd}>
          加入检测列表
        </Button>
      </div>
      <Input.TextArea
        value={value}
        autoSize={{ minRows: 2, maxRows: 4 }}
        placeholder="例如：gpt-4.1, claude-3-5-sonnet, gemini-2.0-flash"
        onChange={handleTextChange}
      />
    </div>
  );
};

// 模型面板
const ModelPanel = ({ state, onFieldChange, onAddManualModels }) => {
  const handleManualTextChange = useMemoizedFn((value) => onFieldChange('manualModelText', value));

  return (
    <Card bordered={false} title="模型选择" className={styles.panelCard}>
      <Space direction="vertical" size={10} className={styles.fullWidth}>
        <ManualModelInput value={state.manualModelText} onChange={handleManualTextChange} onAdd={onAddManualModels} />
        <ModelPicker state={state} onFieldChange={onFieldChange} />
      </Space>
    </Card>
  );
};

// 检测统计项
const ProbeStatCard = ({ label, value }) => (
  <Card size="small" className={styles.statCard}>
    <Typography.Text type="secondary">{label}</Typography.Text>
    <Typography.Title level={4} className={styles.statValue}>
      {value}
    </Typography.Title>
  </Card>
);

// 检测面板
const ProbePanel = ({ state, loading, onCheckChange, onRunDetect, onClearResults, onReset }) => (
  <Card bordered={false} title="脚本生成" className={`${styles.panelCard} ${styles.probeCard}`}>
    <Space direction="vertical" size={12} className={styles.fullWidth}>
      <Radio.Group className={styles.checkGroup} value={state.selectedCheck} options={checkOptions} onChange={onCheckChange} />
      <div className={styles.probeActions}>
        <Button type="primary" size="large" block loading={loading} onClick={onRunDetect}>
          生成脚本
        </Button>
        <Button onClick={onClearResults}>清空脚本</Button>
        <Button danger onClick={onReset}>重置</Button>
      </div>
    </Space>
  </Card>
);

// 创建分组列
const createGroupColumns = () => [
  {
    title: '类型',
    dataIndex: 'checkType',
    width: 110,
    render: (text) => <CopyText text={checkNameMap[text] || text} width={110} />,
  },
  {
    title: 'curl 脚本',
    dataIndex: 'curlCode',
    render: (code) => <CurlCodeBlock code={code} />,
  },
];

// 按模型分组
const groupResultsByModel = (results) =>
  results.reduce((groups, result) => {
    const currentGroup = groups[result.model] || [];
    groups[result.model] = [...currentGroup, result];
    return groups;
  }, {});

// 脚本分组表
const ModelResultGroup = ({ model, results }) => {
  const firstResult = results[0];

  return (
    <Card
      key={model}
      size="small"
      className={styles.resultGroup}
      title={
        <div className={styles.resultGroupHeader}>
          <div className={styles.resultCopyGroup}>
            <CopyChip label="模型" text={model} width={280} />
            <CopyChip label="URL" text={firstResult?.baseUrl} width={240} />
            <CopyChip label="Token" text={firstResult?.token} masked width={150} />
          </div>
        </div>
      }
    >
      <Table
        rowKey="id"
        columns={createGroupColumns()}
        dataSource={results}
        pagination={false}
        bordered
      />
    </Card>
  );
};

// 脚本表格
const ResultTable = ({ results }) => {
  const groupedResults = groupResultsByModel(results);
  const modelIds = Object.keys(groupedResults);

  // 空脚本边界
  if (results.length === 0) {
    return (
      <Card bordered={false} title="curl 脚本" className={styles.resultCard}>
        <Empty description="暂无脚本" />
      </Card>
    );
  }

  return (
    <Card bordered={false} title="curl 脚本" className={styles.resultCard}>
      <Space direction="vertical" size={10} className={styles.resultScroll}>
        {modelIds.map((model) => (
          <ModelResultGroup key={model} model={model} results={groupedResults[model]} />
        ))}
      </Space>
    </Card>
  );
};

// 检测页面
const Detect = () => {
  const state = useReactive({
    stationName: '',
    remark: '',
    baseUrl: '',
    token: '',
    manualModelText: '',
    modelOptions: [],
    modelCategory: 'all',
    selectedModels: [],
    selectedCheck: DEFAULT_CHECK,
    results: [],
    historyOpen: false,
    historyKeyword: '',
    historyList: readHistoryList(),
    selectedHistoryId: '',
    requestId: 0,
  });
  const { loading: modelLoading, run: runFetchModels } = useRequest(fetchModelOptions, {
    manual: true,
    onSuccess: (options, params) => {
      const requestId = params?.[0]?.requestId;
      // 过期请求边界
      if (requestId !== state.requestId) {
        return;
      }
      state.modelOptions = options;
      state.modelCategory = 'all';
      state.selectedModels = [];
      message.success(`模型 ${options.length}`);
    },
    onError: (error) => {
      message.error(error?.message || '模型拉取失败');
    },
  });
  // 更新字段值
  const handleFieldChange = useMemoizedFn((field, value) => {
    state[field] = value;
  });

  // 更新检测项
  const handleCheckChange = useMemoizedFn((e) => {
    state.selectedCheck = e.target.value;
  });

  // 保存历史记录
  const handleSaveHistory = useMemoizedFn(() => {
    // URL 边界
    if (!state.baseUrl.trim()) {
      message.warning('Base URL');
      return false;
    }
    // Token 边界
    if (!state.token.trim()) {
      message.warning('Token');
      return false;
    }
    const record = buildHistoryRecord(state);
    const list = upsertHistoryRecord(state.historyList, record);
    state.historyList = list;
    state.selectedHistoryId = record.id;
    writeHistoryList(list);
    message.success('已保存历史');
    return true;
  });

  // 打开历史弹窗
  const handleOpenHistory = useMemoizedFn(() => {
    state.historyList = readHistoryList();
    state.historyOpen = true;
  });

  // 关闭历史弹窗
  const handleCloseHistory = useMemoizedFn(() => {
    state.historyOpen = false;
  });

  // 更新历史搜索
  const handleHistoryKeywordChange = useMemoizedFn((keyword) => {
    state.historyKeyword = keyword;
  });

  // 选择历史记录
  const handleHistorySelect = useMemoizedFn((selectedIds) => {
    state.selectedHistoryId = selectedIds[0] || '';
  });

  // 导出历史记录
  const handleExportHistory = useMemoizedFn(() => {
    // 空历史边界
    if (state.historyList.length === 0) {
      message.warning('暂无历史可导出');
      return;
    }
    const content = JSON.stringify(state.historyList, null, 2);
    downloadJsonFile('ai-tools-detect-history.json', content);
    message.success('已导出历史');
  });

  // 导入历史记录
  const handleImportHistory = useMemoizedFn(async (file) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const sourceList = Array.isArray(payload) ? payload : payload?.historyList;
      // 格式边界
      if (!Array.isArray(sourceList)) {
        message.error('JSON 格式错误');
        return;
      }
      const importList = sourceList.filter(isValidHistoryRecord).map(normalizeHistoryRecord);
      // 空数据边界
      if (importList.length === 0) {
        message.warning('没有可导入的历史');
        return;
      }
      const list = mergeHistoryList(state.historyList, importList);
      state.historyList = list;
      writeHistoryList(list);
      message.success(`已导入 ${importList.length} 条历史`);
    } catch (error) {
      message.error('JSON 读取失败');
    }
  });

  // 删除历史记录
  const handleDeleteHistory = useMemoizedFn((id) => {
    const list = state.historyList.filter((item) => item.id !== id);
    state.historyList = list;
    writeHistoryList(list);
    // 选中边界
    if (state.selectedHistoryId === id) {
      state.selectedHistoryId = '';
    }
    message.success('已删除历史');
  });

  // 应用历史记录
  const handleApplyHistory = useMemoizedFn(() => {
    const record = state.historyList.find((item) => item.id === state.selectedHistoryId);
    // 未选择边界
    if (!record) {
      message.warning('请选择历史记录');
      return;
    }
    state.stationName = record.stationName || '';
    state.remark = record.remark || '';
    state.baseUrl = record.baseUrl || '';
    state.token = record.token || '';
    state.modelOptions = [];
    state.selectedModels = [];
    state.manualModelText = '';
    state.modelCategory = 'all';
    state.historyOpen = false;
  });

  // 加入手动模型
  const handleAddManualModels = useMemoizedFn(() => {
    const modelIds = parseManualModelIds(state.manualModelText);
    // 空输入边界
    if (modelIds.length === 0) {
      message.warning('请输入模型 ID');
      return;
    }
    state.modelOptions = mergeModelOptions(state.modelOptions, modelIds);
    state.selectedModels = mergeSelectedModels(state.selectedModels, modelIds);
    state.modelCategory = 'all';
    state.manualModelText = '';
    message.success(`已加入 ${modelIds.length} 个模型`);
  });

  // 拉取模型前校验
  const handleFetchModels = useMemoizedFn(() => {
    // URL 边界
    if (!state.baseUrl.trim()) {
      message.warning('Base URL');
      return;
    }
    // Token 边界
    if (!state.token.trim()) {
      message.warning('Token');
      return;
    }
    const hasSaved = handleSaveHistory();
    // 保存边界
    if (!hasSaved) {
      return;
    }
    state.requestId += 1;
    runFetchModels({ baseUrl: state.baseUrl, token: state.token, requestId: state.requestId });
  });

  // 生成脚本前校验
  const handleRunDetect = useMemoizedFn(() => {
    // 模型边界
    if (state.selectedModels.length === 0) {
      message.warning('模型');
      return;
    }
    // 探针边界
    if (!state.selectedCheck) {
      message.warning('探针');
      return;
    }
    const hasSaved = handleSaveHistory();
    // 保存边界
    if (!hasSaved) {
      return;
    }
    const selectedModels = [...state.selectedModels];
    const selectedChecks = [state.selectedCheck];
    state.requestId += 1;
    const requestId = state.requestId;
    const results = buildCurlResults({
      baseUrl: state.baseUrl,
      token: state.token,
      stationName: state.stationName || '未命名',
      remark: state.remark,
      selectedModels,
      selectedChecks,
      requestId,
    });
    state.results = results;
    message.success(`已生成 ${results.length} 条脚本`);
  });

  // 清空脚本结果
  const handleClearResults = useMemoizedFn(() => {
    state.results = [];
  });

  // 重置检测状态
  const handleReset = useMemoizedFn(() => {
    state.requestId += 1;
    state.stationName = '';
    state.remark = '';
    state.baseUrl = '';
    state.token = '';
    state.modelOptions = [];
    state.modelCategory = 'all';
    state.selectedModels = [];
    state.manualModelText = '';
    state.selectedCheck = DEFAULT_CHECK;
    state.results = [];
    state.selectedHistoryId = '';
    message.success('已重置');
  });

  return (
    <Space direction="vertical" size={10} className={`page-stack ${styles.detectPage}`}>
      <PageHeader onOpenHistory={handleOpenHistory} />
      <Row gutter={[12, 12]}>
        <Col xl={18}>
          <ConfigPanel state={state} loading={modelLoading} onFieldChange={handleFieldChange} onFetchModels={handleFetchModels} />
        </Col>
        <Col xl={6}>
          <ProbePanel
            state={state}
            loading={false}
            onCheckChange={handleCheckChange}
            onRunDetect={handleRunDetect}
            onClearResults={handleClearResults}
            onReset={handleReset}
          />
        </Col>
      </Row>
      <ModelPanel state={state} onFieldChange={handleFieldChange} onAddManualModels={handleAddManualModels} />
      <ResultTable results={state.results} />
      <HistoryModal
        state={state}
        onKeywordChange={handleHistoryKeywordChange}
        onImport={handleImportHistory}
        onExport={handleExportHistory}
        onSelect={handleHistorySelect}
        onSave={handleSaveHistory}
        onDelete={handleDeleteHistory}
        onCancel={handleCloseHistory}
        onOk={handleApplyHistory}
      />
    </Space>
  );
};

export default Detect;
