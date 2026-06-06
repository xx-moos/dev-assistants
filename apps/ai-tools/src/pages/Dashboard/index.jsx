import { Card, Col, List, Row, Space, Statistic, Tag, Typography } from 'antd';
import { useMemoizedFn, useRequest } from 'ahooks';
import { metricList, toolList } from '../../utils/toolCatalog';

// 读取指标数据
const getMetricList = async () => metricList;

// 读取近期工具
const getRecentToolList = async () => toolList;

// 渲染指标卡片
const MetricCard = ({ metric }) => (
  <Card bordered={false}>
    <Statistic title={metric.title} value={metric.value} suffix={metric.suffix} />
  </Card>
);

// 渲染工具条目
const RecentToolItem = ({ tool }) => (
  <List.Item>
    <List.Item.Meta
      title={
        <Space>
          <span>{tool.name}</span>
          <Tag color="blue">{tool.category}</Tag>
        </Space>
      }
      description={tool.description}
    />
    <Typography.Text type="secondary">{tool.updatedAt}</Typography.Text>
  </List.Item>
);

// 工作台页面
const Dashboard = () => {
  const { data: metrics = [], loading: isMetricLoading } = useRequest(getMetricList);
  const { data: tools = [], loading: isToolLoading } = useRequest(getRecentToolList);

  // 渲染指标栅格
  const renderMetricCol = useMemoizedFn((metric) => (
    <Col xs={24} sm={12} xl={6} key={metric.id}>
      <MetricCard metric={metric} />
    </Col>
  ));

  // 渲染工具列表项
  const renderRecentTool = useMemoizedFn((tool) => <RecentToolItem tool={tool} />);

  return (
    <Space direction="vertical" size={24} className="page-stack">
      <div>
        <Typography.Title level={3}>工作台</Typography.Title>
        <Typography.Text type="secondary">
          查看 AI 工具平台的核心指标、近期动态与能力沉淀情况。
        </Typography.Text>
      </div>
      <Row gutter={[16, 16]}>{metrics.map(renderMetricCol)}</Row>
      <Card title="近期工具动态" bordered={false} loading={isMetricLoading || isToolLoading}>
        <List dataSource={tools} renderItem={renderRecentTool} />
      </Card>
    </Space>
  );
};

export default Dashboard;
