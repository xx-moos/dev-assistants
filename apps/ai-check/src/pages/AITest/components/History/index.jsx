import React, { useRef } from "react";
import { Button, Select, Space, message, Popconfirm } from "antd";
import {
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

/**
 * 历史记录组件 - 选择/导入/导出测试配置
 * @param {Object} props
 * @param {Array} props.history - 历史记录数组
 * @param {Function} props.setHistory - 更新历史记录
 * @param {Function} props.onSelect - 选中某条记录时的回调，传完整item
 */
export default function History({ history = [], setHistory, onSelect }) {
  const fileInputRef = useRef(null);

  /** 导出JSON - 把历史记录dump成文件下载 */
  const handleExport = () => {
    if (!history.length) {
      message.warning("历史记录为空，没东西可导出");
      return;
    }
    const blob = new Blob([JSON.stringify(history, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-test-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("导出成功");
  };

  /** 导入JSON - 读取文件合并到历史记录 */
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) {
          message.error("JSON格式不对，必须是数组");
          return;
        }

        // 按id去重合并，导入的覆盖已有的
        const existingMap = new Map(history.map((item) => [item.id, item]));
        imported.forEach((item) => {
          if (!item.id || !item.url || !item.token) {
            return; // 跳过不合法的记录
          }
          existingMap.set(item.id, item);
        });

        const merged = Array.from(existingMap.values()).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setHistory(merged);
        message.success(`导入成功，当前共 ${merged.length} 条记录`);
      } catch {
        message.error("JSON解析失败，文件格式有问题");
      }
    };
    reader.readAsText(file);
    // 重置input，否则选同一个文件不会触发onChange
    e.target.value = "";
  };

  /** 清空全部历史 */
  const handleClearAll = () => {
    setHistory([]);
    message.success("历史记录已清空");
  };

  return (
    <Space size="small">
      历史记录
      <Select
        style={{ width: 360 }}
        options={history.map((item) => ({
          label: `${item.name} (${item.url})`,
          value: item.id,
        }))}
        onChange={(value) => {
          const item = history.find((h) => h.id === value);
          if (item && onSelect) {
            onSelect(item);
          }
        }}
        placeholder="选择历史记录"
        allowClear
        showSearch
        filterOption={(input, option) =>
          option.label.toLowerCase().includes(input.toLowerCase())
        }
      />

      {/* 隐藏的文件input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleImport}
      />

      <Button
        size="small"
        icon={<ImportOutlined />}
        onClick={() => fileInputRef.current?.click()}
      >
        导入
      </Button>

      <Button size="small" icon={<ExportOutlined />} onClick={handleExport}>
        导出
      </Button>

      {history.length > 0 && (
        <Popconfirm
          title="确定要清空所有历史记录？"
          onConfirm={handleClearAll}
          okText="清空"
          cancelText="算了"
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )}
    </Space>
  );
}
