import { Card, Col, Empty, Input, Row, Select, Space, Tag, Typography } from 'antd';
import { useMemoizedFn, useReactive, useRequest } from 'ahooks';
import { toolList } from '../../utils/toolCatalog';

const statusOptions = [
  {
    label: '全部状态',
    value: 'all',
  },
  {
    label: '已上线',
    value: '已上线',
  },
  {
    label: '内测中',
    value: '内测中',
  },
  {
    label: '规划中',
    value: '规划中',
  },
];

// 读取工具列表
const getToolList = async () => toolList;

// 筛选工具列表
const filterToolList = (tools, keyword, status) => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  return tools.filter((tool) => {
    const isKeywordMatched =
      !normalizedKeyword ||
      tool.name.toLowerCase().includes(normalizedKeyword) ||
      tool.category.toLowerCase().includes(normalizedKeyword);
    const isStatusMatched = status === 'all' || tool.status === status;

    return isKeywordMatched && isStatusMatched;
  });
};

// 工具筛选栏
const ToolFilter = ({ keyword, status, onKeywordChange, onStatusChange }) => (
  <Card bordered={false}>
    <Space wrap>
      <Input.Search
        allowClear
        placeholder="搜索工具名称或分类"
        value={keyword}
        onChange={onKeywordChange}
        style={{ width: 280 }}
      />
      <Select
        value={status}
        options={statusOptions}
        onChange={onStatusChange}
        style={{ width: 160 }}
      />
    </Space>
  </Card>
);

// 工具卡片
const ToolCard = ({ tool }) => (
  <Card bordered={false} title={tool.name} extra={<Tag color="blue">{tool.status}</Tag>}>
    <Space direction="vertical" size={12}>
      <Typography.Text type="secondary">{tool.description}</Typography.Text>
      <Space wrap>
        <Tag>{tool.category}</Tag>
        <Tag color="geekblue">{tool.owner}</Tag>
      </Space>
      <Typography.Text type="secondary">更新日期：{tool.updatedAt}</Typography.Text>
    </Space>
  </Card>
);

// 工具中心页面
const Tools = () => {
  const state = useReactive({
    keyword: '',
    status: 'all',
  });
  const { data: tools = [], loading: isLoading } = useRequest(getToolList);
  const visibleTools = filterToolList(tools, state.keyword, state.status);

  // 更新搜索词
  const handleKeywordChange = useMemoizedFn((event) => {
    state.keyword = event.target.value;
  });

  // 更新状态筛选
  const handleStatusChange = useMemoizedFn((value) => {
    state.status = value;
  });

  // 渲染工具栅格
  const renderToolCol = useMemoizedFn((tool) => (
    <Col xs={24} lg={8} key={tool.id}>
      <ToolCard tool={tool} />
    </Col>
  ));

  // 空结果边界
  if (!isLoading && visibleTools.length === 0) {
    return (
      <Space direction="vertical" size={24} className="page-stack">
        <ToolFilter
          keyword={state.keyword}
          status={state.status}
          onKeywordChange={handleKeywordChange}
          onStatusChange={handleStatusChange}
        />
        <Card bordered={false}>
          <Empty description="暂无匹配工具" />
        </Card>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={24} className="page-stack">
      <div>
        <Typography.Title level={3}>工具中心</Typography.Title>
        <Typography.Text type="secondary">
          管理企业内部 AI 能力入口，帮助团队快速发现和复用工具。
        </Typography.Text>
      </div>
      <ToolFilter
        keyword={state.keyword}
        status={state.status}
        onKeywordChange={handleKeywordChange}
        onStatusChange={handleStatusChange}
      />
      <Row gutter={[16, 16]}>{visibleTools.map(renderToolCol)}</Row>
    </Space>
  );
};

export default Tools;
