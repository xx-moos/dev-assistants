import React from "react";
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  Flex,
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
import History from "../History";
import { fetchModelList } from "../../../../utils/aiTest";

import ModelCard from "../ModelCard";
import TestTypeCard from "../TestTypeCard";

export default function CenterCard({
  allModels,
  changeModelCallback,
  changeTestTypeCallback,
}) {
  return (
    <Card
      styles={{
        header: {
          padding: 10,
        },
        body: {
          padding: "10px 10px",
          height: 180,
        },
        root: {
          marginBottom: 8,
        },
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <ModelCard
            changeModelCallback={changeModelCallback}
            allModels={allModels}
          />
        </Col>
        <Col span={12}>
          <TestTypeCard changeTestTypeCallback={changeTestTypeCallback} />
        </Col>
      </Row>
    </Card>
  );
}
