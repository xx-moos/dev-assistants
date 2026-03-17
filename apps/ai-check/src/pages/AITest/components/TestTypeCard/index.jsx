import React from "react";
import { Button, Checkbox, Col, Divider, Row } from "antd";
import { useReactive } from "ahooks";

export default function TestTypeCard({ changeTestTypeCallback }) {
  const state = useReactive({
    types: [
      { key: "text", label: "文本能力" },
      { key: "image", label: "图像理解" },
      { key: "codex", label: "Codex" },
      { key: "cc", label: "Claude Code" },
    ],
    selectedTypes: ["text"],
  });

  return (
    <>
      <Checkbox.Group
        style={{ width: "100%" }}
        value={state.selectedTypes}
        onChange={(value) => {
          state.selectedTypes = value;
        }}
      >
        <Row gutter={[0, 8]}>
          {state.types.map((item) => (
            <Col span={4} key={item.key}>
              <Checkbox value={item.key}>{item.label}</Checkbox>
            </Col>
          ))}
        </Row>
      </Checkbox.Group>
      <Divider />
      <div style={{ marginBottom: 12 }}>
        <a
          onClick={() => {
            state.selectedTypes = ["text", "image", "codex", "cc"];
          }}
        >
          全选
        </a>
        &nbsp;
        <a
          onClick={() => {
            state.selectedTypes = [];
          }}
        >
          清除
        </a>
      </div>
      <Button
        type="primary"
        block
        onClick={() => {
          changeTestTypeCallback.emit(state.selectedTypes);
        }}
      >
        开始测试
      </Button>
    </>
  );
}
