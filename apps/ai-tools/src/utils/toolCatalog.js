import dayjs from 'dayjs';

export const toolList = [
  {
    id: 'prompt-lab',
    name: '提示词实验室',
    category: '内容生成',
    owner: 'AI 平台组',
    status: '已上线',
    updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    description: '沉淀通用提示词模板，支持业务团队快速复用。',
  },
  {
    id: 'code-review',
    name: '代码评审助手',
    category: '研发提效',
    owner: '工程效能组',
    status: '内测中',
    updatedAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
    description: '聚合代码质量建议，辅助识别边界条件与回归风险。',
  },
  {
    id: 'doc-writer',
    name: '文档生成器',
    category: '知识管理',
    owner: '产品运营组',
    status: '规划中',
    updatedAt: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    description: '根据结构化输入生成说明文档、FAQ 与发布记录。',
  },
];

export const metricList = [
  {
    id: 'active-tools',
    title: '可用工具',
    value: 12,
    suffix: '个',
  },
  {
    id: 'daily-runs',
    title: '今日调用',
    value: 2480,
    suffix: '次',
  },
  {
    id: 'saved-hours',
    title: '节省工时',
    value: 186,
    suffix: '小时',
  },
  {
    id: 'success-rate',
    title: '成功率',
    value: 98.6,
    suffix: '%',
  },
];
