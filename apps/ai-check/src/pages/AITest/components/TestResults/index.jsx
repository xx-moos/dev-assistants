import React from 'react';
import { Tag, Button, Spin, message } from 'antd';
import {
  CopyOutlined,
  MessageOutlined,
  FileImageOutlined,
  ToolOutlined,
  CodeOutlined
} from '@ant-design/icons';
import styles from './index.module.less';

export default function TestResults({ testResults, onCopyResult }) {
  const getModelType = (modelId) => {
    const name = modelId.toLowerCase();
    if (name.includes('gpt') || name.includes('openai')) return 'gpt';
    if (name.includes('claude')) return 'claude';
    if (name.includes('gemini')) return 'gemini';
    return 'other';
  };

  // 艹，复制单个测试结果的函数
  const copyTestResult = (modelId, testType, content) => {
    if (!content) {
      message.warning('没有内容可复制');
      return;
    }
    const text = `模型: ${modelId}\n测试类型: ${testType}\n结果:\n${content}`;
    navigator.clipboard.writeText(text);
    message.success(`${testType}测试结果已复制`);
  };

  return (
    <div className={styles.testResults}>
      {Object.entries(testResults).map(([modelId, result]) => (
        <div key={modelId} className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <div className={styles.modelInfo}>
              <span className={styles.modelName}>{modelId}</span>
              <Tag className={`${styles.modelType} ${styles[getModelType(modelId)]}`}>
                {getModelType(modelId).toUpperCase()}
              </Tag>
              <CopyOutlined
                onClick={() => {
                  navigator.clipboard.writeText(modelId);
                  message.success('模型ID已复制');
                }}
                style={{ cursor: 'pointer', color: '#1890ff', marginLeft: 8 }}
                title="复制模型ID"
              />
            </div>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => onCopyResult(modelId)}
            >
              复制完整结果
            </Button>
          </div>

          <div className={styles.resultBody}>
            {/* 文本测试 */}
            {result.text && (
              <div className={styles.testItem}>
                <div className={styles.testHeader}>
                  <Tag
                    color={
                      result.text.status === 'success'
                        ? 'success'
                        : result.text.status === 'failed'
                        ? 'error'
                        : 'warning'
                    }
                    className={styles.testTag}
                  >
                    <MessageOutlined /> 文本测试
                  </Tag>
                  {result.text.status === 'success' && (
                    <CopyOutlined
                      onClick={() => copyTestResult(modelId, '文本测试', result.text.content)}
                      style={{ cursor: 'pointer', color: '#1890ff' }}
                      title="复制文本测试结果"
                    />
                  )}
                </div>
                <div className={styles.testContent}>
                  {result.text.status === 'success' ? (
                    <>
                      <div className={styles.successText}>{result.text.content}</div>
                      {result.text.usage && (
                        <div className={styles.usage}>
                          用量: {result.text.usage.total_tokens} tokens
                        </div>
                      )}
                    </>
                  ) : result.text.status === 'failed' ? (
                    <div className={styles.errorText}>❌ {result.text.error}</div>
                  ) : (
                    <Spin size="small" />
                  )}
                </div>
              </div>
            )}

            {/* 图像测试 */}
            {result.image && (
              <div className={styles.testItem}>
                <div className={styles.testHeader}>
                  <Tag
                    color={
                      result.image.status === 'success'
                        ? 'success'
                        : result.image.status === 'failed'
                        ? 'error'
                        : 'warning'
                    }
                    className={styles.testTag}
                  >
                    <FileImageOutlined /> 图像测试
                  </Tag>
                  {result.image.status === 'success' && (
                    <CopyOutlined
                      onClick={() => copyTestResult(modelId, '图像测试', result.image.content)}
                      style={{ cursor: 'pointer', color: '#1890ff' }}
                      title="复制图像测试结果"
                    />
                  )}
                </div>
                <div className={styles.testContent}>
                  {result.image.status === 'success' ? (
                    <div className={styles.successText}>{result.image.content}</div>
                  ) : result.image.status === 'failed' ? (
                    <div className={styles.errorText}>❌ {result.image.error}</div>
                  ) : (
                    <Spin size="small" />
                  )}
                </div>
              </div>
            )}

            {/* 工具调用测试 */}
            {result.tool && (
              <div className={styles.testItem}>
                <div className={styles.testHeader}>
                  <Tag
                    color={
                      result.tool.status === 'success'
                        ? 'success'
                        : result.tool.status === 'failed'
                        ? 'error'
                        : 'warning'
                    }
                    className={styles.testTag}
                  >
                    <ToolOutlined /> 工具调用测试
                  </Tag>
                  {result.tool.status === 'success' && (
                    <CopyOutlined
                      onClick={() => copyTestResult(modelId, '工具调用测试', result.tool.content)}
                      style={{ cursor: 'pointer', color: '#1890ff' }}
                      title="复制工具调用测试结果"
                    />
                  )}
                </div>
                <div className={styles.testContent}>
                  {result.tool.status === 'success' ? (
                    <pre className={styles.codeBlock}>{result.tool.content}</pre>
                  ) : result.tool.status === 'failed' ? (
                    <div className={styles.errorText}>❌ {result.tool.error}</div>
                  ) : (
                    <Spin size="small" />
                  )}
                </div>
              </div>
            )}

            {/* 艹，ClaudeCode测试 */}
            {result.claudecode && (
              <div className={styles.testItem}>
                <div className={styles.testHeader}>
                  <Tag
                    color={
                      result.claudecode.status === 'success'
                        ? 'success'
                        : result.claudecode.status === 'failed'
                        ? 'error'
                        : 'warning'
                    }
                    className={styles.testTag}
                  >
                    <CodeOutlined /> ClaudeCode测试
                  </Tag>
                  {result.claudecode.status === 'success' && (
                    <CopyOutlined
                      onClick={() => copyTestResult(modelId, 'ClaudeCode测试', result.claudecode.content)}
                      style={{ cursor: 'pointer', color: '#1890ff' }}
                      title="复制ClaudeCode测试结果"
                    />
                  )}
                </div>
                <div className={styles.testContent}>
                  {result.claudecode.status === 'success' ? (
                    <>
                      <pre className={styles.codeBlock}>{result.claudecode.content}</pre>
                      {result.claudecode.usage && (
                        <div className={styles.usage}>
                          用量: {result.claudecode.usage.total_tokens} tokens
                        </div>
                      )}
                    </>
                  ) : result.claudecode.status === 'failed' ? (
                    <div className={styles.errorText}>❌ {result.claudecode.error}</div>
                  ) : (
                    <Spin size="small" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
