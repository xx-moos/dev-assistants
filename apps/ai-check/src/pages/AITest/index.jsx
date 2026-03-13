import React, { useState } from 'react';
import { Form, message } from 'antd';
import { ApiOutlined, ThunderboltOutlined, MessageOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import axios from 'axios';
import ConfigForm from './components/ConfigForm';
import ModelList from './components/ModelList';
import TestResults from './components/TestResults';
import styles from './index.module.less';

export default function AITest() {
  const [form] = Form.useForm();
  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [testResults, setTestResults] = useState({});
  const [filterType, setFilterType] = useState('all');

  // 获取模型列表
  const { loading: fetchingModels, run: fetchModels } = useRequest(
    async (values) => {
      const { url, apiKey } = values;
      const response = await axios.get(`${url}/v1/models`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      return response.data.data || [];
    },
    {
      manual: true,
      onSuccess: (data) => {
        setModels(data);
        message.success(`成功获取 ${data.length} 个模型`);
      },
      onError: (error) => {
        message.error(`获取模型失败: ${error.message}`);
      }
    }
  );

  // 手动添加模型
  const handleManualAdd = () => {
    const modelNames = form.getFieldValue('modelNames') || '';
    const names = modelNames.split('\n').filter(n => n.trim());
    setModels(names.map(name => ({ id: name.trim() })));
    message.success(`手动添加了 ${names.length} 个模型`);
  };

  // 测试单个模型
  const testModel = async (modelId, config) => {
    const { url, apiKey } = config;
    const results = {
      modelId,
      text: { status: 'testing' },
      image: { status: 'testing' },
      tool: { status: 'testing' }
    };

    setTestResults(prev => ({ ...prev, [modelId]: results }));

    // 测试文本能力
    try {
      const textResponse = await axios.post(
        `${url}/v1/chat/completions`,
        {
          model: modelId,
          messages: [{ role: 'user', content: '你好，请用一句话介绍你自己' }],
          max_tokens: 100
        },
        { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 30000 }
      );
      results.text = {
        status: 'success',
        content: textResponse.data.choices[0].message.content,
        usage: textResponse.data.usage
      };
    } catch (error) {
      results.text = { status: 'failed', error: error.message };
    }

    setTestResults(prev => ({ ...prev, [modelId]: { ...results } }));

    // 测试图像能力
    try {
      const imageResponse = await axios.post(
        `${url}/v1/chat/completions`,
        {
          model: modelId,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: '这张图片里有什么？' },
              {
                type: 'image_url',
                image_url: { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }
              }
            ]
          }],
          max_tokens: 100
        },
        { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 30000 }
      );
      results.image = {
        status: 'success',
        content: imageResponse.data.choices[0].message.content
      };
    } catch (error) {
      results.image = { status: 'failed', error: error.message };
    }

    setTestResults(prev => ({ ...prev, [modelId]: { ...results } }));

    // 测试工具调用能力
    try {
      const toolResponse = await axios.post(
        `${url}/v1/chat/completions`,
        {
          model: modelId,
          messages: [{ role: 'user', content: '北京今天天气怎么样？' }],
          tools: [{
            type: 'function',
            function: {
              name: 'get_weather',
              description: '获取指定城市的天气信息',
              parameters: {
                type: 'object',
                properties: {
                  city: { type: 'string', description: '城市名称' }
                },
                required: ['city']
              }
            }
          }],
          tool_choice: 'auto',
          max_tokens: 100
        },
        { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 30000 }
      );

      const hasToolCall = toolResponse.data.choices[0].message.tool_calls?.length > 0;
      results.tool = {
        status: hasToolCall ? 'success' : 'failed',
        content: hasToolCall
          ? JSON.stringify(toolResponse.data.choices[0].message.tool_calls, null, 2)
          : '模型未调用工具',
        hasToolCall
      };
    } catch (error) {
      results.tool = { status: 'failed', error: error.message };
    }

    setTestResults(prev => ({ ...prev, [modelId]: { ...results } }));
    return results;
  };

  // 批量测试
  const { loading: testing, run: runTests } = useRequest(
    async () => {
      const config = form.getFieldsValue();
      const results = {};

      for (const modelId of selectedModels) {
        results[modelId] = await testModel(modelId, config);
      }

      return results;
    },
    {
      manual: true,
      onSuccess: () => {
        message.success('所有测试完成！');
      },
      onError: (error) => {
        message.error(`测试失败: ${error.message}`);
      }
    }
  );

  // 切换模型选择
  const toggleModelSelection = (modelId) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  // 复制测试结果
  const copyResult = (modelId) => {
    const result = testResults[modelId];
    if (!result) return;

    const text = `模型: ${modelId}
文本测试: ${result.text.status === 'success' ? '✓ 通过' : '✗ 失败'}
${result.text.content || result.text.error || ''}

图像测试: ${result.image.status === 'success' ? '✓ 通过' : '✗ 失败'}
${result.image.content || result.image.error || ''}

工具调用测试: ${result.tool.status === 'success' ? '✓ 通过' : '✗ 失败'}
${result.tool.content || result.tool.error || ''}`;

    navigator.clipboard.writeText(text);
    message.success('测试结果已复制到剪贴板');
  };

  // 复制成功的模型配置
  const copySuccessModels = () => {
    const successModels = Object.entries(testResults)
      .filter(([_, result]) =>
        result.text.status === 'success' ||
        result.image.status === 'success' ||
        result.tool.status === 'success'
      )
      .map(([modelId]) => modelId);

    if (successModels.length === 0) {
      message.warning('没有测试成功的模型');
      return;
    }

    const config = form.getFieldsValue();
    const text = JSON.stringify({
      url: config.url,
      apiKey: config.apiKey,
      models: successModels
    }, null, 2);

    navigator.clipboard.writeText(text);
    message.success(`已复制 ${successModels.length} 个成功模型的配置`);
  };

  const getModelType = (modelId) => {
    const name = modelId.toLowerCase();
    if (name.includes('gpt') || name.includes('openai')) return 'gpt';
    if (name.includes('claude')) return 'claude';
    if (name.includes('gemini')) return 'gemini';
    return 'other';
  };

  const filteredModels = models.filter(model => {
    if (filterType === 'all') return true;
    return getModelType(model.id) === filterType;
  });

  return (
    <div className={styles.container}>
      <div className={styles.mainCard}>
        <div className={styles.header}>
          <h1>
            <ApiOutlined /> AI模型测试平台
          </h1>
          <p>支持OpenAI、Claude、Gemini等多种模型的能力测试</p>
        </div>

        <div className={styles.content}>
          {/* 配置表单 */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <ThunderboltOutlined /> 接口配置
            </div>
            <ConfigForm
              form={form}
              onFetchModels={fetchModels}
              onManualAdd={handleManualAdd}
              loading={fetchingModels}
            />
          </div>

          {/* 模型列表 */}
          {models.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <MessageOutlined /> 模型列表 ({filteredModels.length})
              </div>
              <ModelList
                models={models}
                selectedModels={selectedModels}
                testResults={testResults}
                filterType={filterType}
                testing={testing}
                onFilterChange={setFilterType}
                onToggleModel={toggleModelSelection}
                onRunTests={runTests}
                onSelectAll={() => setSelectedModels(filteredModels.map(m => m.id))}
                onClearSelection={() => setSelectedModels([])}
                onCopySuccess={copySuccessModels}
              />
            </div>
          )}

          {/* 测试结果 */}
          {Object.keys(testResults).length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <CheckCircleOutlined /> 测试结果
              </div>
              <TestResults
                testResults={testResults}
                onCopyResult={copyResult}
              />
            </div>
          )}

          {/* 空状态 */}
          {models.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.icon}>
                <ApiOutlined />
              </div>
              <p>请先配置API信息并获取模型列表</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
