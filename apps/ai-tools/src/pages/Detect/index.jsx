import { Button, Card, Checkbox, Col, Empty, Input, Row, Space, Table, Tag, Typography, message } from 'antd';
import { useMemoizedFn, useReactive, useRequest } from 'ahooks';
import {
  DEFAULT_CHECKS,
  checkNameMap,
  checkOptions,
  fetchModelOptions,
  maskToken,
  runProbeJobs,
  statusMap,
} from './probeUtils';
import styles from './index.module.less';

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

// 配置面板
const ConfigPanel = ({ state, loading, onFieldChange, onFetchModels }) => {
  const handleNameChange = useMemoizedFn((event) => onFieldChange('stationName', event.target.value));
  const handleRemarkChange = useMemoizedFn((event) => onFieldChange('remark', event.target.value));
  const handleUrlChange = useMemoizedFn((event) => onFieldChange('baseUrl', event.target.value));
  const handleTokenChange = useMemoizedFn((event) => onFieldChange('token', event.target.value));

  return (
    <Card bordered={false} className={styles.panelCard}>
      <Space orientation="vertical" size={10} className={styles.fullWidth}>
        <Row gutter={[10, 10]}>
          <Col md={12}>
            <div className={styles.fieldBlock}>
              <Typography.Text strong className={styles.label}>名称</Typography.Text>
              <Input size="large" value={state.stationName} onChange={handleNameChange} />
            </div>
          </Col>
          <Col md={12}>
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
          <Input.Password size="large" value={state.token} onChange={handleTokenChange} />
        </div>
        <div className={styles.fetchBar}>
          <Button type="primary" loading={loading} onClick={onFetchModels} size=''>
            拉取模型
          </Button>
          <Typography.Text type="secondary">{state.modelOptions.length} 个模型</Typography.Text>
        </div>
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
const ProbePanel = ({ state, loading, onCheckChange, onRunDetect, onClearResults }) => (
  <Card bordered={false} title="探针检测" className={`${styles.panelCard} ${styles.probeCard}`}>
    <Space direction="vertical" size={12} className={styles.fullWidth}>
      <Checkbox.Group className={styles.checkGroup} value={state.selectedChecks} options={checkOptions} onChange={onCheckChange} />
      <div className={styles.probeActions}>
        <Button type="primary" size="large" block loading={loading} onClick={onRunDetect}>
          开始检测
        </Button>
        <Button onClick={onClearResults}>清空结果</Button>
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
  });
  const { loading: modelLoading, run: runFetchModels } = useRequest(fetchModelOptions, {
    manual: true,
    onSuccess: (options) => {
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
    onSuccess: (count) => {
      message.success(`完成 ${count}`);
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
  const handleResultAppend = useMemoizedFn((result) => {
    state.results = [result, ...state.results];
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
    runFetchModels({ baseUrl: state.baseUrl, token: state.token });
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
    runDetect({
      baseUrl: state.baseUrl,
      token: state.token,
      stationName: state.stationName || '未命名',
      remark: state.remark,
      selectedModels: state.selectedModels,
      selectedChecks: state.selectedChecks,
      onResult: handleResultAppend,
    });
  });

  // 清空检测结果
  const handleClearResults = useMemoizedFn(() => {
    state.results = [];
  });

  return (
    <Space direction="vertical" size={10} className={`page-stack ${styles.detectPage}`}>
      <Typography.Title level={5} className={styles.pageTitle}>
        AI 中转站检测台
      </Typography.Title>
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
          />
        </Col>
      </Row>
      <ResultTable results={state.results} status={state.resultStatus} onStatusChange={handleResultStatusChange} />
    </Space>
  );
};

export default Detect;
