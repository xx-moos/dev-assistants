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
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="API Key"
          name="apiKey"
          rules={[{ required: true, message: '请输入API Key' }]}
        >
          <Input.Password
            placeholder="sk-..."
            size="large"
          />
        </Form.Item>

        <Form.Item label="配置名称" name="name">
          <Input placeholder="给这个配置起个名字" />
        </Form.Item>

        <Form.Item label="备注" name="remark">
          <TextArea rows={2} placeholder="备注信息" />
        </Form.Item>

        <Space size="middle">
          <Button
            type="primary"
            icon={<RocketOutlined />}
            loading={loading}
            onClick={() => form.validateFields().then(onFetchModels)}
            size="large"
          >
            获取模型列表
          </Button>
          <Button
            onClick={onManualAdd}
            size="large"
          >
            手动添加模型
          </Button>
        </Space>

        <Form.Item
          label="手动输入模型名称（每行一个）"
          name="modelNames"
          style={{ marginTop: 16 }}
        >
          <TextArea
            rows={4}
            placeholder="gpt-4&#10;claude-3-opus&#10;gemini-pro"
          />
        </Form.Item>
      </Form>
    </div>
  );
}
