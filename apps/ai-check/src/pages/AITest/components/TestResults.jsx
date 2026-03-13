import React from 'react';
import { Tag, Button, Space, Spin } from 'antd';
import {
  CopyOutlined,
  MessageOutlined,
  FileImageOutlined,
  ToolOutlined
} from '@ant-design/icons';
import styles from './TestResults.module.less';

export default function TestResults({ testResults, onCopyResult }) {
  const getModelType = (modelId) => {
    const name = modelId.toLowerCase();
    if (name.includes('gpt') || name.includes('openai')) return 'gpt';
    if (name.includes('claude')) return 'claude';
    if (name.includes('gemini')) return 'gemini';
    return 'other';
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
            </div>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => onCopyResult(modelId)}
            >
              复制结果
            </Button>
          </div>

          <div className={styles.resultBody}>
            {/* 文本测试 */}
            <div className={styles.testItem}>
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

            {/* 图像测试 */}
            <div className={styles.testItem}>
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

            {/* 工具调用测试 */}
            <div className={styles.testItem}>
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
          </div>
        </div>
      ))}
    </div>
  );
}
