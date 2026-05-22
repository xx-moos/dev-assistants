import React, { useRef } from "react";
import {
  Button,
  Empty,
  Modal,
  Popconfirm,
  Radio,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  ExportOutlined,
  HistoryOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import { useMemoizedFn, useReactive } from "ahooks";

const { Text, Paragraph } = Typography;

/**
 * 历史记录组件 - 弹窗形式选择/导入/导出测试配置
 * @param {Object} props
 * @param {Array} props.history - 历史记录数组
 * @param {Function} props.setHistory - 更新历史记录
 * @param {Function} props.onSelect - 确定按钮回调，传完整 item
 */
export default function History({ history = [], setHistory, onSelect }) {
  const fileInputRef = useRef(null);

  const state = useReactive({
    open: false,
    selectedId: undefined,
  });

  /** 打开弹窗时默认选中第一条 */
  const openModal = useMemoizedFn(() => {
    state.selectedId = history[0]?.id;
    state.open = true;
  });

  const closeModal = useMemoizedFn(() => {
    state.open = false;
  });

  /** 当前选中记录（用于右侧详情展示） */
  const selectedItem = history.find((item) => item.id === state.selectedId);

  /** 确定按钮：回显当前选中项数据到页面 */
  const handleOk = useMemoizedFn(() => {
    if (!selectedItem) {
      message.warning("请先选择一条历史记录");
      return;
    }
    onSelect?.(selectedItem);
    message.success(`已加载：${selectedItem.name || selectedItem.url}`);
    state.open = false;
  });

  /** 导出JSON */
  const handleExport = useMemoizedFn(() => {
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
  });

  /** 导入JSON */
  const handleImport = useMemoizedFn((e) => {
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

        const existingMap = new Map(history.map((item) => [item.id, item]));
        imported.forEach((item) => {
          if (!item.id || !item.url || !item.token) return;
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
    e.target.value = "";
  });

  /** 清空全部历史 */
  const handleClearAll = useMemoizedFn(() => {
    setHistory([]);
    state.selectedId = undefined;
    message.success("历史记录已清空");
  });

  /** 删除单条历史记录 */
  const handleDeleteItem = useMemoizedFn((id) => {
    const next = history.filter((item) => item.id !== id);
    setHistory(next);
    if (state.selectedId === id) {
      state.selectedId = next[0]?.id;
    }
    message.success("已删除该记录");
  });

  /** Radio 选项的内容渲染：name + url 主信息 */
  const renderRadioItem = (item) => (
    <Radio key={item.id} value={item.id} style={radioItemStyle}>
      <div style={radioItemInner}>
        <div style={radioItemHeader}>
          <Text strong ellipsis style={{ maxWidth: 200 }}>
            {item.name || "未命名"}
          </Text>
          {item.remark ? (
            <Tag color="blue" style={{ marginInlineStart: 8 }}>
              有备注
            </Tag>
          ) : null}
        </div>
        <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
          {item.url}
        </Text>
      </div>
    </Radio>
  );

  return (
    <>
      <Space size="small">
        <Button
          icon={<HistoryOutlined />}
          onClick={openModal}
          disabled={!history.length}
        >
          历史记录{history.length ? `（${history.length}）` : ""}
        </Button>

        {/* 隐藏的文件 input */}
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

      <Modal
        title="历史记录"
        open={state.open}
        onOk={handleOk}
        onCancel={closeModal}
        okText="确定"
        cancelText="取消"
        width={820}
        destroyOnHidden
      >
        {history.length === 0 ? (
          <Empty description="暂无历史记录" />
        ) : (
          <div style={modalBodyStyle}>
            <div style={listPaneStyle}>
              <Radio.Group
                block
                value={state.selectedId}
                onChange={(e) => (state.selectedId = e.target.value)}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  {history.map(renderRadioItem)}
                </Space>
              </Radio.Group>
            </div>

            <div style={detailPaneStyle}>
              {selectedItem ? (
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  <div>
                    <Text type="secondary" style={labelStyle}>
                      名称
                    </Text>
                    <Paragraph style={valueStyle}>
                      {selectedItem.name || "—"}
                    </Paragraph>
                  </div>

                  <div>
                    <Text type="secondary" style={labelStyle}>
                      URL
                    </Text>
                    <Paragraph
                      style={valueStyle}
                      copyable={{ text: selectedItem.url }}
                    >
                      {selectedItem.url}
                    </Paragraph>
                  </div>

                  <div>
                    <Text type="secondary" style={labelStyle}>
                      Token
                    </Text>
                    <Paragraph
                      style={valueStyle}
                      copyable={{ text: selectedItem.token }}
                    >
                      {selectedItem.token
                        ? `${selectedItem.token.slice(0, 6)}***${selectedItem.token.slice(-4)}`
                        : "—"}
                    </Paragraph>
                  </div>

                  <div>
                    <Text type="secondary" style={labelStyle}>
                      备注
                    </Text>
                    <Paragraph style={remarkStyle}>
                      {selectedItem.remark || "（未填写）"}
                    </Paragraph>
                  </div>

                  <div>
                    <Text type="secondary" style={labelStyle}>
                      创建时间
                    </Text>
                    <Paragraph style={valueStyle}>
                      {selectedItem.createdAt
                        ? new Date(selectedItem.createdAt).toLocaleString()
                        : "—"}
                    </Paragraph>
                  </div>

                  <Popconfirm
                    title="确定要删除这条记录？"
                    onConfirm={() => handleDeleteItem(selectedItem.id)}
                    okText="删除"
                    cancelText="算了"
                  >
                    <Button danger size="small" icon={<DeleteOutlined />}>
                      删除该记录
                    </Button>
                  </Popconfirm>
                </Space>
              ) : (
                <Empty description="请选择左侧记录" />
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

const modalBodyStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  maxHeight: 480,
};

const listPaneStyle = {
  borderRight: "1px solid #f0f0f0",
  paddingRight: 12,
  overflowY: "auto",
};

const detailPaneStyle = {
  paddingLeft: 4,
  overflowY: "auto",
};

const radioItemStyle = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #f0f0f0",
  borderRadius: 8,
  marginInlineEnd: 0,
};

const radioItemInner = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
};

const radioItemHeader = {
  display: "flex",
  alignItems: "center",
};

const labelStyle = {
  fontSize: 12,
};

const valueStyle = {
  marginTop: 4,
  marginBottom: 0,
  fontSize: 14,
  wordBreak: "break-all",
};

const remarkStyle = {
  marginTop: 4,
  marginBottom: 0,
  fontSize: 14,
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  background: "#fafafa",
  border: "1px solid #f0f0f0",
  borderRadius: 6,
  padding: "8px 10px",
};
