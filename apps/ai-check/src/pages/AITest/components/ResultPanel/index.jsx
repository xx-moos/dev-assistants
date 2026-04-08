import React, { useState, useMemo } from "react";
import { Spin, Tag, Radio } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  FilterOutlined,
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
 */
function getModelStatus(item) {
  const { tests, testTypes } = item;
  const completedTests = Object.values(tests).filter((t) => t);
  
  // 还没有完成任何测试
  if (completedTests.length === 0) {
    return "pending";
  }
  
  // 全部完成且全部成功
  if (
    completedTests.length === testTypes.length &&
    completedTests.every((t) => t.status === "success")
  ) {
    return "success";
  }
  
  // 有任何一个失败
  if (completedTests.some((t) => t.status === "failed")) {
    return "failed";
  }
  
  // 还在进行中
  return "pending";
}

/**
 * 单个测试结果项
 */
function TestResultItem({ type, result }) {
  const label = TEST_TYPE_LABELS[type] || type;

  // 还在跑
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
 */
function ModelResultCard({ item }) {
  const { modelId, url, token, tests, testTypes } = item;

  return (
    <div className={styles.resultCard}>
      <div className={styles.cardHeader}>
        <span className={styles.modelName} title={modelId}>
          {modelId}
        </span>
        <Tag
          styles={{
            root: {
              fontSize: 16,
            },
          }}
          color={
            Object.values(tests).every((t) => t?.status === "success")
              ? "success"
              : Object.values(tests).some((t) => t?.status === "failed")
              ? "error"
              : "processing"
          }
        >
          {Object.values(tests).filter((t) => t).length}/{testTypes.length}
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
      <FilterOutlined style={{ marginRight: 8, color: "#666" }} />
      <Radio.Group
        value={filter}
        onChange={(e) => onChange(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        size="small"
      >
        <Radio.Button value="all">
          {FILTER_OPTIONS.all} ({counts.all})
        </Radio.Button>
        <Radio.Button value="success">
          <CheckCircleOutlined style={{ color: filter === "success" ? "#fff" : "#52c41a" }} />{" "}
          {FILTER_OPTIONS.success} ({counts.success})
        </Radio.Button>
        <Radio.Button value="failed">
          <CloseCircleOutlined style={{ color: filter === "failed" ? "#fff" : "#ff4d4f" }} />{" "}
          {FILTER_OPTIONS.failed} ({counts.failed})
        </Radio.Button>
        <Radio.Button value="pending">
          <LoadingOutlined style={{ color: filter === "pending" ? "#fff" : "#1890ff" }} />{" "}
          {FILTER_OPTIONS.pending} ({counts.pending})
        </Radio.Button>
      </Radio.Group>
    </div>
  );
}

/**
 * 测试结果面板 - 展示所有模型的测试结果
 * results 数据结构：
 * [{ modelId, url, token, testTypes: string[], tests: { [type]: result } }]
 */
export default function ResultPanel({ results = [], loading = false }) {
  const [filter, setFilter] = useState("all");

  // 计算各状态数量
  const counts = useMemo(() => {
    const result = { all: results.length, success: 0, failed: 0, pending: 0 };
    results.forEach((item) => {
      const status = getModelStatus(item);
      result[status]++;
    });
    return result;
  }, [results]);

  // 过滤后的结果
  const filteredResults = useMemo(() => {
    if (filter === "all") return results;
    return results.filter((item) => getModelStatus(item) === filter);
  }, [results, filter]);

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
