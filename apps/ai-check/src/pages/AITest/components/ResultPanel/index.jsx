import React, { useState, useEffect } from "react";
import { Spin, Tag, Radio } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import CopyableText from "../CopyableText";
import styles from "./index.module.less";

/** 测试类型中文映射 */
const TEST_TYPE_LABELS = {
  text: "文本能力",
  image: "图像理解",
  codex: "Codex",
  cc: "Claude Code",
};

/** 过滤选项 */
const FILTER_OPTIONS = {
  all: "全部",
  success: "仅成功",
  failed: "仅失败",
  pending: "进行中",
};

/**
 * 判断单个模型的状态
 * 只关注 testTypes 中声明的测试项，忽略 tests 对象中多余的 key
 */
function getModelStatus(item) {
  const { tests, testTypes } = item;

  // 防御：testTypes 为空或不存在
  if (!testTypes || testTypes.length === 0) {
    return "pending";
  }

  // ✅ 只取 testTypes 中声明的测试结果，避免 tests 中有多余 key 干扰
  const relevantResults = testTypes.map((type) => tests[type]).filter(Boolean);

  // 还没有完成任何测试
  if (relevantResults.length === 0) {
    return "pending";
  }

  // 有任何一个失败 → 优先判定为 failed（不管是否全部完成）
  if (relevantResults.some((t) => t.status === "failed")) {
    return "failed";
  }

  // 全部完成且全部成功
  if (
    relevantResults.length === testTypes.length &&
    relevantResults.every((t) => t.status === "success")
  ) {
    return "success";
  }

  // 其余情况：还在进行中
  return "pending";
}

/**
 * 根据模型状态返回 Tag 颜色
 */
function getStatusTagColor(status) {
  switch (status) {
    case "success":
      return "success";
    case "failed":
      return "error";
    default:
      return "processing";
  }
}

/**
 * 单个测试结果项
 */
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
  const statusCls = isSuccess ? styles.statusSuccess : styles.statusFailed;
  const icon = isSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
  const content = isSuccess ? result.content || "通过" : result.error || "失败";

  return (
    <div className={styles.testItem}>
      <span className={`${styles.testLabel} ${statusCls}`}>
        {icon} {label}
      </span>
      <span className={styles.testContent}>{content}</span>
    </div>
  );
}

/**
 * 单个模型的结果卡片
 * ✅ 复用 getModelStatus，保证 Tag 颜色与过滤器逻辑一致
 */
function ModelResultCard({ item }) {
  const { modelId, url, token, tests, testTypes } = item;
  const status = getModelStatus(item);
  const completedCount = testTypes.filter((type) => tests[type]).length;

  return (
    <div className={styles.resultCard}>
      <div className={styles.cardHeader}>
        <span className={styles.modelName} title={modelId}>
          {modelId}
        </span>
        <Tag
          styles={{ root: { fontSize: 16 } }}
          color={getStatusTagColor(status)}
        >
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

/**
 * 过滤器组件
 */
function FilterBar({ filter, onChange, counts }) {
  return (
    <div className={styles.filterBar}>
      <Radio.Group
        value={filter}
        onChange={(e) => onChange(e.target.value)}
        optionType="button"
        buttonStyle="solid"
      >
        <Radio.Button value="all">
          {FILTER_OPTIONS.all} ({counts.all})
        </Radio.Button>
        <Radio.Button value="success">
          <CheckCircleOutlined
            style={{ color: filter === "success" ? "#fff" : "#52c41a" }}
          />{" "}
          {FILTER_OPTIONS.success} ({counts.success})
        </Radio.Button>
        <Radio.Button value="failed">
          <CloseCircleOutlined
            style={{ color: filter === "failed" ? "#fff" : "#ff4d4f" }}
          />{" "}
          {FILTER_OPTIONS.failed} ({counts.failed})
        </Radio.Button>
        <Radio.Button value="pending">
          <LoadingOutlined
            style={{ color: filter === "pending" ? "#fff" : "#1890ff" }}
          />{" "}
          {FILTER_OPTIONS.pending} ({counts.pending})
        </Radio.Button>
      </Radio.Group>
    </div>
  );
}

/**
 * 测试结果面板
 */
export default function ResultPanel({ results = [], loading = false }) {
  const [filter, setFilter] = useState("all");

  // 每次渲染重新计算状态（results 来自 useReactive proxy，引用不变，useMemo 无法感知深层变更）
  const statusMap = new Map();
  results.forEach((item) => {
    statusMap.set(item.modelId, getModelStatus(item));
  });

  // 计算各状态数量
  const counts = { all: results.length, success: 0, failed: 0, pending: 0 };
  statusMap.forEach((status) => {
    counts[status]++;
  });

  // ✅ 当前 filter 下无数据时，自动回退到 "all"
  useEffect(() => {
    if (filter !== "all" && counts[filter] === 0 && counts.all > 0) {
      setFilter("all");
    }
  }, [counts, filter]);

  // 过滤后的结果
  const filteredResults =
    filter === "all"
      ? results
      : results.filter((item) => statusMap.get(item.modelId) === filter);

  if (!results.length) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <FilterBar filter={filter} onChange={setFilter} counts={counts} />

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
          暂无{FILTER_OPTIONS[filter]}的结果
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
