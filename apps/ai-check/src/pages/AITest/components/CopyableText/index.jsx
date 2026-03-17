import React from "react";
import { Typography, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";

/**
 * 可点击复制的文本组件
 * 点一下就复制，简单粗暴
 */
export default function CopyableText({ label, value, type = "default" }) {
  if (!value) return null;

  // 脱敏显示：token 只显示前8位和后4位
  const displayValue =
    type === "token" && value.length > 16
      ? `${value.slice(0, 8)}****${value.slice(-4)}`
      : value;

  const colorMap = {
    url: "#1677ff",
    token: "#52c41a",
    model: "#722ed1",
    default: "#333",
  };

  return (
    <Typography.Text
      style={{
        cursor: "pointer",
        color: colorMap[type] || colorMap.default,
        fontSize: 14,
        padding: "2px 6px",
        borderRadius: 4,
        background: "rgba(0,0,0,0.04)",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        maxWidth: "100%",
        transition: "background 0.2s",
      }}
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          message.success(`${label} 已复制`);
        });
      }}
      title={`点击复制 ${label}: ${value}`}
    >
      <span style={{ fontWeight: 500, color: "#999", flexShrink: 0 }}>
        {label}:
      </span>
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {displayValue}
      </span>
      <CopyOutlined style={{ fontSize: 11, color: "#bbb", flexShrink: 0 }} />
    </Typography.Text>
  );
}
