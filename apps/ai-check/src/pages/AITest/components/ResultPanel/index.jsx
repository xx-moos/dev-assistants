import React from "react";
import { Spin, Tag, Radio } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useReactive } from "ahooks";
import CopyableText from "../CopyableText";
import styles from "./index.module.less";

/** 测试类型中文映射 */
const TEST_TYPE_LABELS = {
  text: "文本能力",
  image: "图像理解",
  codex: "Codex",
  cc: "Claude Code",
};

/** 状态配置：统一管理颜色、图标、Tag 色值、样式类名 */
const STATUS_CONFIG = {
  success: {
    icon: <CheckCircleOutlined />,
    color: "#52c41a",
    tagColor: "success",
    cls: "statusSuccess",
  },
  failed: {
    icon: <CloseCircleOutlined />,
    color: "#ff4d4f",
    tagColor: "error",
    cls: "statusFailed",
  },
  pending: {
    icon: <LoadingOutlined />,
    color: "#1890ff",
    tagColor: "processing",
    cls: "statusLoading",
  },
};

/** 过滤选项配置 */
const FILTER_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "success", label: "成功" },
  { value: "failed", label: "失败" },
  { value: "pending", label: "进行中" },
];

/** 过滤选项文案映射，用于空状态提示 */
const FILTER_LABEL_MAP = Object.fromEntries(
  FILTER_OPTIONS.map((o) => [o.value, o.label])
);

/** 判断单个模型状态，只关注 testTypes 中声明的测试项 */
function getModelStatus(item) {
  const { tests, testTypes } = item;

  if (!testTypes?.length) return "pending";

  const relevantResults = testTypes.map((type) => tests[type]).filter(Boolean);

  if (relevantResults.length === 0) return "pending";

  if (relevantResults.some((t) => t.status === "failed")) return "failed";

  if (
    relevantResults.length === testTypes.length &&
    relevantResults.every((t) => t.status === "success")
  ) {
    return "success";
  }

  return "pending";
}

/** 计算 statusMap 和各状态计数 */
function computeStatusCounts(results) {
  const statusMap = new Map();
  const counts = { all: results.length, success: 0, failed: 0, pending: 0 };

  results.forEach((item) => {
    const status = getModelStatus(item);
    statusMap.set(item.modelId, status);
    counts[status]++;
  });

  return { statusMap, counts };
}

/** 单个测试结果项 */
function TestResultItem({ type, result }) {
  const label = TEST_TYPE_LABELS[type] || type;

  if (!result) {
    return (
      <div className={styles.testItem}>
        <span className={`${styles.testLabel} ${styles.statusLoading}`}>
          <LoadingOutlined spin /> {label}
        </span>
        <span className={styles.testContent}>测试中...</span>
      </div>
    );
  }

  const isSuccess = result.status === "success";
  const cfg = STATUS_CONFIG[isSuccess ? "success" : "failed"];
  const content = isSuccess ? result.content || "通过" : result.error || "失败";

  return (
    <div className={styles.testItem}>
      <span className={`${styles.testLabel} ${styles[cfg.cls]}`}>
        {cfg.icon} {label}
      </span>
      <span className={styles.testContent}>{content}</span>
    </div>
  );
}

/** 单个模型的结果卡片 */
function ModelResultCard({ item }) {
  const { modelId, url, token, tests, testTypes } = item;
  const status = getModelStatus(item);
  const completedCount = testTypes.filter((type) => tests[type]).length;
  const { tagColor } = STATUS_CONFIG[status];

  return (
    <div className={styles.resultCard}>
      <div className={styles.cardHeader}>
        <span className={styles.modelName} title={modelId}>
          {modelId}
        </span>
        <Tag styles={{ root: { fontSize: 16 } }} color={tagColor}>
          {completedCount}/{testTypes.length}
        </Tag>
      </div>

      <div className={styles.copyFields}>
        <CopyableText label="URL" value={url} type="url" />
        <CopyableText label="Token" value={token} type="token" />
        <CopyableText label="Model" value={modelId} type="model" />
      </div>

      <div className={styles.testResults}>
        {testTypes.map((type) => (
          <TestResultItem key={type} type={type} result={tests[type]} />
        ))}
      </div>
    </div>
  );
}

/** 过滤器组件，通过配置驱动渲染 */
function FilterBar({ filter, onChange, counts }) {
  return (
    <div className={styles.filterBar}>
      <Radio.Group
        value={filter}
        onChange={(e) => onChange(e.target.value)}
        optionType="button"
        buttonStyle="solid"
      >
        {FILTER_OPTIONS.map(({ value, label }) => {
          return (
            <Radio.Button key={value} value={value}>
              {label} ({counts[value]})
            </Radio.Button>
          );
        })}
      </Radio.Group>
    </div>
  );
}

/** 测试结果面板 */
export default function ResultPanel({ results = [], loading = false }) {
  const state = useReactive({ filter: "all" });

  // results 来自 useReactive proxy，引用不变，每次渲染重新计算
  const { statusMap, counts } = computeStatusCounts(results);

  const filteredResults =
    state.filter === "all"
      ? results
      : results.filter((item) => statusMap.get(item.modelId) === state.filter);

  if (!results.length) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <FilterBar
        filter={state.filter}
        onChange={(val) => (state.filter = val)}
        counts={counts}
      />

      {loading && (
        <div style={{ textAlign: "center", marginBottom: 8, marginTop: 8 }}>
          <Spin size="small" />{" "}
          <span style={{ color: "#999", fontSize: 14 }}>
            测试进行中，稳住别慌...
          </span>
        </div>
      )}

      {filteredResults.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#999" }}>
          暂无{FILTER_LABEL_MAP[state.filter]}的结果
        </div>
      ) : (
        <div className={styles.resultGrid}>
          {filteredResults.map((item) => (
            <ModelResultCard key={item.modelId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
