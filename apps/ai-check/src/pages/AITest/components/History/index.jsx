import React from "react";
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  PullRequestOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useLocalStorageState } from "ahooks";

export default function History(changeCallback) {
  const [history] = useLocalStorageState("ai-check-history", {
    defaultValue: [],
  });

  return (
    <Space>
      <Select
        style={{ width: 460 }}
        options={history.map((item) => ({ label: item.name, value: item.id }))}
        onChange={(value) => {
          changeCallback(value);
        }}
        placeholder="选择历史记录"
        showSearch={{
          filterOption: (input, option) =>
            option.label.toLowerCase().includes(input.toLowerCase()),
        }}
      />

      <Button type="primary">导入</Button>

      <Button type="primary">导出</Button>
    </Space>
  );
}
