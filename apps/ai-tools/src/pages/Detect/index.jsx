import { Card, Empty, Space, Typography } from 'antd';

// 检测页面
const Detect = () => (
  <Space direction="vertical" size={24} className="page-stack">
    <div>
      <Typography.Title level={3}>检测页面</Typography.Title>
      <Typography.Text type="secondary">
        检测能力暂未接入，当前仅保留页面入口与基础占位。
      </Typography.Text>
    </div>
    <Card bordered={false}>
      <Empty description="检测功能占位中" />
    </Card>
  </Space>
);

export default Detect;
