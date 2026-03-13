import React from 'react';
import { Tag, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  MessageOutlined,
  FileImageOutlined,
  ToolOutlined
} from '@ant-design/icons';
import styles from './index.module.less';

export default function ModelCard({ model, isSelected, status, result, onToggle }) {
  const getModelType = (modelId) => {
    const name = modelId.toLowerCase();
    if (name.includes('gpt') || name.includes('openai')) return 'gpt';
    if (name.includes('claude')) return 'claude';
    if (name.includes('gemini')) return 'gemini';
    return 'other';
  };

  const modelType = getModelType(model.id);

  return (
    <div
      className={`${styles.modelCard} ${isSelected ? styles.selected : ''} ${styles[status]}`}
      onClick={() => onToggle(model.id)}
    >
      <div className={styles.cardHeader}>
        <div className={styles.modelName}>
          {isSelected && <CheckCircleOutlined className={styles.checkIcon} />}
          <span>{model.id}</span>
        </div>
        <Tag className={`${styles.modelType} ${styles[modelType]}`}>
          {modelType.toUpperCase()}
        </Tag>
      </div>

      {result && (
        <div className={styles.testStatus}>
          <Tooltip title={result.text.content || result.text.error}>
            <Tag
              className={styles.statusBadge}
              color={
                result.text.status === 'success'
                  ? 'success'
                  : result.text.status === 'failed'
                  ? 'error'
                  : 'warning'
              }
            >
              <MessageOutlined /> 文本
            </Tag>
          </Tooltip>
          <Tooltip title={result.image.content || result.image.error}>
            <Tag
              className={styles.statusBadge}
              color={
                result.image.status === 'success'
                  ? 'success'
                  : result.image.status === 'failed'
                  ? 'error'
                  : 'warning'
              }
            >
              <FileImageOutlined /> 图像
            </Tag>
          </Tooltip>
          <Tooltip title={result.tool.content || result.tool.error}>
            <Tag
              className={styles.statusBadge}
              color={
                result.tool.status === 'success'
                  ? 'success'
                  : result.tool.status === 'failed'
                  ? 'error'
                  : 'warning'
              }
            >
              <ToolOutlined /> 工具
            </Tag>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
