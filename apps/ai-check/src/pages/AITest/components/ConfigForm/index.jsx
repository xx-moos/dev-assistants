import React from 'react';
import { Form, Input, Button, Space } from 'antd';
import { ApiOutlined, RocketOutlined } from '@ant-design/icons';
import styles from './index.module.less';

const { TextArea } = Input;

export default function ConfigForm({ form, onFetchModels, onManualAdd, loading }) {
  return (
    <div className={styles.configForm}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          url: '',
          apiKey: '',
          name: '测试配置',
          remark: ''
        }}
      >
        <Form.Item
          label="API地址"
          name="url"
          rules={[{ required: true, message: '请输入API地址' }]}
        >
          <Input
            placeholder="https://api.openai.com"
            prefix={<ApiOutlined />}
          />
        </Form.Item>

        <Form.Item
          label="API Key"
          name="apiKey"
          rules={[{ required: true, message: '请输入API Key' }]}
        >
          <Input.Password
            placeholder="sk-..."
          />
        </Form.Item>

        <Space size="small">
          <Button
            type="primary"
            icon={<RocketOutlined />}
            loading={loading}
            onClick={() => form.validateFields().then(onFetchModels)}
          >
            获取模型列表
          </Button>
          <Button
            onClick={onManualAdd}
          >
            手动添加模型
          </Button>
        </Space>

        <Form.Item
          label="手动输入模型"
          name="modelNames"
          style={{ marginTop: 12 }}
        >
          <TextArea
            rows={3}
            placeholder="gpt-4&#10;claude-3-opus&#10;gemini-pro"
          />
        </Form.Item>
      </Form>
    </div>
  );
}
