import React from 'react';
import { Button, Space } from 'antd';
import { RocketOutlined, CopyOutlined } from '@ant-design/icons';
import ModelCard from '../ModelCard';
import styles from './index.module.less';

export default function ModelList({
  models,
  selectedModels,
  testResults,
  filterType,
  testing,
  onFilterChange,
  onToggleModel,
  onRunTests,
  onSelectAll,
  onClearSelection,
  onCopySuccess
}) {
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

  const getModelStatus = (modelId) => {
    const result = testResults[modelId];
    if (!result) return 'pending';

    // 艹，动态获取所有测试状态，不要硬编码
    const statuses = Object.keys(result)
      .filter(key => key !== 'modelId')
      .map(key => result[key]?.status)
      .filter(Boolean);

    if (statuses.length === 0) return 'pending';
    if (statuses.includes('testing')) return 'testing';
    if (statuses.every(s => s === 'success')) return 'success';
    if (statuses.some(s => s === 'success')) return 'partial';
    return 'failed';
  };

  return (
    <div className={styles.modelList}>
      <div className={styles.filterBar}>
        <Space size="small">
          <Button
            type={filterType === 'all' ? 'primary' : 'default'}
            onClick={() => onFilterChange('all')}
            size="small"
          >
            全部 ({models.length})
          </Button>
          <Button
            type={filterType === 'gpt' ? 'primary' : 'default'}
            onClick={() => onFilterChange('gpt')}
            size="small"
          >
            GPT ({models.filter(m => getModelType(m.id) === 'gpt').length})
          </Button>
          <Button
            type={filterType === 'claude' ? 'primary' : 'default'}
            onClick={() => onFilterChange('claude')}
            size="small"
          >
            Claude ({models.filter(m => getModelType(m.id) === 'claude').length})
          </Button>
          <Button
            type={filterType === 'gemini' ? 'primary' : 'default'}
            onClick={() => onFilterChange('gemini')}
            size="small"
          >
            Gemini ({models.filter(m => getModelType(m.id) === 'gemini').length})
          </Button>
        </Space>
      </div>

      <div className={styles.actionBar}>
        <Button
          type="primary"
          icon={<RocketOutlined />}
          loading={testing}
          disabled={selectedModels.length === 0}
          onClick={onRunTests}
          size="large"
        >
          测试选中模型 ({selectedModels.length})
        </Button>
        <Space>
          <Button onClick={onSelectAll}>全选当前筛选</Button>
          <Button onClick={onClearSelection}>清空选择</Button>
          <Button
            icon={<CopyOutlined />}
            onClick={onCopySuccess}
            disabled={Object.keys(testResults).length === 0}
          >
            复制成功配置
          </Button>
        </Space>
      </div>

      <div className={styles.modelGrid}>
        {filteredModels.map(model => (
          <ModelCard
            key={model.id}
            model={model}
            isSelected={selectedModels.includes(model.id)}
            status={getModelStatus(model.id)}
            result={testResults[model.id]}
            onToggle={onToggleModel}
          />
        ))}
      </div>
    </div>
  );
}
