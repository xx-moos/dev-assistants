import { Card, Form, Input, Select, Space, Switch, Typography, Button, App } from 'antd';
import { useMemoizedFn, useReactive, useRequest } from 'ahooks';

const modelOptions = [
  {
    label: 'GPT-4.1',
    value: 'gpt-4.1',
  },
  {
    label: 'Claude Sonnet',
    value: 'claude-sonnet',
  },
  {
    label: 'Gemini Pro',
    value: 'gemini-pro',
  },
];

// 保存系统配置
const saveSettings = async (values) => values;

// 系统设置页面
const Settings = () => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const state = useReactive({
    isAuditEnabled: true,
  });

  // 保存成功提示
  const handleSaveSuccess = useMemoizedFn(() => {
    message.success('配置已保存');
  });

  const { run: submitSettings, loading: isSubmitting } = useRequest(saveSettings, {
    manual: true,
    onSuccess: handleSaveSuccess,
  });

  // 切换审计开关
  const handleAuditChange = useMemoizedFn((checked) => {
    state.isAuditEnabled = checked;
  });

  // 提交系统配置
  const handleSubmit = useMemoizedFn(async () => {
    const values = await form.validateFields();
    submitSettings({
      ...values,
      isAuditEnabled: state.isAuditEnabled,
    });
  });

  return (
    <Space direction="vertical" size={24} className="page-stack">
      <div>
        <Typography.Title level={3}>系统设置</Typography.Title>
        <Typography.Text type="secondary">
          管理默认模型、访问策略与审计能力，保持企业级使用边界清晰。
        </Typography.Text>
      </div>
      <Card title="基础配置" bordered={false}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            defaultModel: 'gpt-4.1',
            workspaceName: '企业 AI 工具平台',
          }}
        >
          <Form.Item
            name="workspaceName"
            label="工作区名称"
            rules={[{ required: true, message: '请输入工作区名称' }]}
          >
            <Input placeholder="请输入工作区名称" />
          </Form.Item>
          <Form.Item
            name="defaultModel"
            label="默认模型"
            rules={[{ required: true, message: '请选择默认模型' }]}
          >
            <Select options={modelOptions} />
          </Form.Item>
          <Form.Item label="调用审计">
            <Switch
              checked={state.isAuditEnabled}
              checkedChildren="开启"
              unCheckedChildren="关闭"
              onChange={handleAuditChange}
            />
          </Form.Item>
          <Button type="primary" loading={isSubmitting} onClick={handleSubmit}>
            保存配置
          </Button>
        </Form>
      </Card>
    </Space>
  );
};

export default Settings;
