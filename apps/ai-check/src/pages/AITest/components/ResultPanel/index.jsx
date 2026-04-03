import React from "react";
import { Spin, Tag } from "antd";
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
 * 测试结果面板 - 展示所有模型的测试结果
 * results 数据结构：
 * [{ modelId, url, token, testTypes: string[], tests: { [type]: result } }]
 */
export default function ResultPanel({ results = [], loading = false }) {
  if (!results.length) return null;

  return (
    <div style={{ marginTop: 8 }}>
      {loading && (
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <Spin size="small" />{" "}
          <span style={{ color: "#999", fontSize: 14 }}>
            测试进行中，稳住别慌...
          </span>
        </div>
      )}
      <div className={styles.resultGrid}>
        {results.map((item) => (
          <ModelResultCard key={item.modelId} item={item} />
        ))}
      </div>
    </div>
  );
}
