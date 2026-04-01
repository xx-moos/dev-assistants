import React, { useEffect } from "react";
import { Checkbox, Col, Form, Row, Tabs } from "antd";
import { useReactive } from "ahooks";

export default function ModelCard({ allModels, changeModelCallback }) {
  const [form] = Form.useForm();

  const state = useReactive({
    activeKey: "1",
    models: [],

    ids: [],
  });

  useEffect(() => {
    state.models = allModels;
  }, [allModels]);

  return (
    <>
      <div></div>
      <Tabs
        items={[
          {
            key: "1",
            label: "全部",
          },
          {
            key: "gpt,5.4,open,5.3,5",
            label: "OpenAI",
          },
          {
            key: "claude,Claude",
            label: "Claude",
          },
          {
            key: "gemini",
            label: "Gemini",
          },
        ]}
        onChange={(key) => {
          state.activeKey = key;
          const keyArr = key.split(",");
          state.models = allModels.filter((item) =>
            keyArr.some((k) => item.id.includes(k)),
          );
        }}
        tabBarExtraContent={
          <a
            onClick={() => {
              state.ids = [];
            }}
          >
            清除选择的模型
          </a>
        }
      />

      <div style={{ maxHeight: 90, overflowY: "auto" }}>
        <Checkbox.Group
          onChange={(value) => {
            state.ids = value;
            changeModelCallback.emit(value);
          }}
          value={state.ids}
        >
          <Row gutter={[0, 8]}>
            {state.models.map((item) => (
              <Col span={8} key={item.id}>
                <Checkbox value={item.id}>{item.id}</Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>
      </div>
    </>
  );
}
