import React, { useEffect } from "react";
import {
  Button,
  Card,
  Checkbox,
  Col,
  ConfigProvider,
  Divider,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tabs,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  PullRequestOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import History from "../History";
import { fetchModelList } from "../../../../utils/aiTest";
import { useReactive } from "ahooks";
import styles from "./index.module.less";

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
