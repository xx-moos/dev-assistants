import { useRef } from 'react';
import { Button, Card, Checkbox, Col, Empty, Input, Modal, Popconfirm, Row, Space, Table, Tag, Typography, message } from 'antd';
import { useMemoizedFn, useReactive, useRequest } from 'ahooks';
import {
  DEFAULT_CHECKS,
  checkNameMap,
  checkOptions,
  fetchModelOptions,
  maskToken,
  normalizeBaseUrl,
  runProbeJobs,
  statusMap,
} from './probeUtils';
import styles from './index.module.less';

const HISTORY_STORAGE_KEY = 'ai-tools-detect-history';
const RESULT_FILTERS = ['all', 'success', 'failed'];
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

// 状态标签
const StatusTag = ({ status }) => {
  const statusClass = status === 'success' ? styles.statusSuccess : styles.statusFailed;

  return (
    <Tag className={`${styles.statusTag} ${statusClass}`} color={statusMap[status]?.color}>
      {statusMap[status]?.text}
    </Tag>
  );
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
      width: 130,
      render: renderName,
    },
    {
      title: 'URL',
      dataIndex: 'baseUrl',
      width: 150,
      render: renderUrl,
    },
    {
      title: 'Token',
      dataIndex: 'token',
      width: 150,
      render: renderToken,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      render: renderToken,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
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

// 模型面板
const ModelPanel = ({ state, onFieldChange }) => (
  <Card bordered={false} title="模型选择" className={styles.panelCard}>
    <ModelPicker state={state} onFieldChange={onFieldChange} />
  </Card>
);

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
  <Card bordered={false} title="探针检测" className={`${styles.panelCard} ${styles.probeCard}`}>
    <Space direction="vertical" size={12} className={styles.fullWidth}>
      <Checkbox.Group className={styles.checkGroup} value={state.selectedChecks} options={checkOptions} onChange={onCheckChange} />
      <div className={styles.probeActions}>
        <Button type="primary" size="large" block loading={loading} onClick={onRunDetect}>
          开始检测
        </Button>
        <Button onClick={onClearResults}>清空结果</Button>
        <Button danger onClick={onReset}>重置</Button>
      </div>
    </Space>
  </Card>
);

// 统计结果数量
const countResults = (results, status) => {
  // 全部结果边界
  if (status === 'all') {
    return results.length;
  }
  return results.filter((result) => result.status === status).length;
};

// 筛选按钮
const ResultFilterButton = ({ option, status, onStatusChange }) => {
  const type = status === option.value ? 'primary' : 'default';
  const handleClick = useMemoizedFn(() => onStatusChange(option.value));

  return (
    <Button size="" type={type} onClick={handleClick}>
      {option.label}
    </Button>
  );
};

// 结果筛选栏
const ResultFilter = ({ results, status, onStatusChange }) => {
  const options = [
    { label: `全部(${countResults(results, 'all')})`, value: 'all' },
    { label: `成功(${countResults(results, 'success')})`, value: 'success' },
    { label: `失败(${countResults(results, 'failed')})`, value: 'failed' },
  ];
  const renderOption = useMemoizedFn((option) => (
    <ResultFilterButton key={option.value} option={option} status={status} onStatusChange={onStatusChange} />
  ));

  return <Space wrap>{options.map(renderOption)}</Space>;
};

// 创建分组列
const createGroupColumns = () => [
  {
    title: '检测',
    dataIndex: 'checkType',
    width: 110,
    render: (text) => <CopyText text={checkNameMap[text] || text} width={110} />,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 90,
    render: (status) => <StatusTag status={status} />,
  },
  {
    title: '耗时',
    dataIndex: 'duration',
    width: 100,
    render: (duration) => <CopyText text={`${duration}ms`} width={90} />,
  },
  {
    title: '结果',
    dataIndex: 'summary',
    render: (text) => <CopyText text={text} className={styles.summaryText} />,
  },
];

// 按模型分组
const groupResultsByModel = (results) =>
  results.reduce((groups, result) => {
    const currentGroup = groups[result.model] || [];
    groups[result.model] = [...currentGroup, result];
    return groups;
  }, {});

// 结果分组表
const ModelResultGroup = ({ model, results }) => {
  const firstResult = results[0];
  const successCount = countResults(results, 'success');
  const failedCount = countResults(results, 'failed');

  return (
    <Card
      key={model}
      size="small"
      className={styles.resultGroup}
      title={
        <div className={styles.resultGroupHeader}>
          <div className={styles.resultCounters}>
            {/* <Tag color="green">成功 {successCount}</Tag>
            <Tag color="red">失败 {failedCount}</Tag> */}
          </div>
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

// 结果表格
const ResultTable = ({ results, status, onStatusChange }) => {
  const visibleResults = status === 'all' ? results : results.filter((result) => result.status === status);
  const groupedResults = groupResultsByModel(visibleResults);
  const modelIds = Object.keys(groupedResults);

  // 空结果边界
  if (results.length === 0) {
    return (
      <Card bordered={false} title="检测结果" className={styles.resultCard}>
        <Empty description="暂无结果" />
      </Card>
    );
  }

  return (
    <Card bordered={false} title="检测结果" className={styles.resultCard} extra={<ResultFilter results={results} status={status} onStatusChange={onStatusChange} />}>
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
    modelOptions: [],
    modelCategory: 'all',
    selectedModels: [],
    selectedChecks: DEFAULT_CHECKS,
    resultStatus: 'all',
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
      state.selectedModels = options.map((option) => option.value);
      message.success(`模型 ${options.length}`);
    },
    onError: (error) => {
      message.error(error?.message || '模型拉取失败');
    },
  });
  const { loading: detectLoading, run: runDetect } = useRequest(runProbeJobs, {
    manual: true,
    onSuccess: (count, params) => {
      const requestId = params?.[0]?.requestId;
      // 过期请求边界
      if (requestId !== state.requestId) {
        return;
      }
      message.success(`完成 ${count}`);
    },
    onError: (error) => {
      message.error(error?.message || '检测失败');
    },
  });

  // 更新字段值
  const handleFieldChange = useMemoizedFn((field, value) => {
    state[field] = value;
  });

  // 更新检测项
  const handleCheckChange = useMemoizedFn((values) => {
    state.selectedChecks = values;
  });

  // 更新结果分类
  const handleResultStatusChange = useMemoizedFn((status) => {
    // 状态边界
    if (!RESULT_FILTERS.includes(status)) {
      return;
    }
    state.resultStatus = status;
  });

  // 写入检测结果
  const handleResultAppend = useMemoizedFn((requestId, result) => {
    // 过期结果边界
    if (requestId !== state.requestId) {
      return;
    }
    state.results = [result, ...state.results];
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
    state.modelCategory = 'all';
    state.historyOpen = false;
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

  // 开始检测前校验
  const handleRunDetect = useMemoizedFn(() => {
    // 模型边界
    if (state.selectedModels.length === 0) {
      message.warning('模型');
      return;
    }
    // 探针边界
    if (state.selectedChecks.length === 0) {
      message.warning('探针');
      return;
    }
    const hasSaved = handleSaveHistory();
    // 保存边界
    if (!hasSaved) {
      return;
    }
    state.requestId += 1;
    const requestId = state.requestId;
    runDetect({
      baseUrl: state.baseUrl,
      token: state.token,
      stationName: state.stationName || '未命名',
      remark: state.remark,
      selectedModels: state.selectedModels,
      selectedChecks: state.selectedChecks,
      requestId,
      shouldStop: () => requestId !== state.requestId,
      onResult: (result) => handleResultAppend(requestId, result),
    });
  });

  // 清空检测结果
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
    state.selectedChecks = DEFAULT_CHECKS;
    state.resultStatus = 'all';
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
            loading={detectLoading}
            onCheckChange={handleCheckChange}
            onRunDetect={handleRunDetect}
            onClearResults={handleClearResults}
            onReset={handleReset}
          />
        </Col>
      </Row>
      <ModelPanel state={state} onFieldChange={handleFieldChange} />
      <ResultTable results={state.results} status={state.resultStatus} onStatusChange={handleResultStatusChange} />
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
