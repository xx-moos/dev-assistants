import React from "react";
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  Flex,
  Form,
  Input,
  message,
  Row,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  PullRequestOutlined,
  RedoOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useReactive } from "ahooks";
import History from "../History";
import { fetchModelList } from "../../../../utils/aiTest";

export default function ConfigCard({
  fetchModelListCallback,
  form,
  history,
  setHistory,
  saveRemarkCallback,
}) {
  const btnState = useReactive({
    fetchLoading: false,
    saveLoading: false,
  });

  return (
    <ConfigProvider
      theme={{
        components: {
          Form: {
            itemMarginBottom: 12,
          },
          Card: {
            headerFontSize: 14,
            headerHeight: 42,
            headerPadding: 8,
            bodyPadding: 10,
          },
        },
      }}
    >
      <Card
        title={
          <Flex gap="middle" align="center" justify="space-between">
            <Space align="center">
              <Link to="/">
                <ArrowLeftOutlined />
              </Link>
              AI测试参数
            </Space>

            <History
              history={history}
              setHistory={setHistory}
              onSelect={(item) => {
                form.setFieldsValue({
                  url: item?.url,
                  token: item?.token,
                  name: item?.name,
                  remark: item?.remark,
                });
              }}
            />
          </Flex>
        }
        styles={{
          root: {
            marginBottom: 8,
          },
        }}
      >
        <Form
          size="large"
          autoComplete="off"
          form={form}
        >
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item name="url" label="URL">
                <Input
                  placeholder="请输入URL"
                  allowClear
                  variant="underlined"
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="token" label="Token">
                <Input
                  placeholder="请输入Token"
                  allowClear
                  variant="underlined"
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="name" label="名称">
                <Input placeholder="请输入名称" allowClear variant="filled" />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Space>
                <Button
                  type="primary"
                  icon={<PullRequestOutlined />}
                  loading={btnState.fetchLoading}
                  onClick={async () => {
                    const { url, token } = form.getFieldsValue();
                    if (url && token) {
                      btnState.fetchLoading = true;
                      try {
                        const res = await fetchModelList(url, token);
                        fetchModelListCallback(res || []);
                      } finally {
                        btnState.fetchLoading = false;
                      }
                    } else {
                      message.error("请输入URL和Token");
                    }
                  }}
                >
                  拉取模型
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields();
                    fetchModelListCallback?.([]);
                  }}
                  icon={<RedoOutlined />}
                >
                  重置
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={btnState.saveLoading}
                  onClick={async () => {
                    const { url, token, remark } = form.getFieldsValue();
                    if (!url || !token) {
                      message.error("URL和Token都没填，保存个寂寞");
                      return;
                    }
                    if (!remark) {
                      message.warning("备注为空，写点东西再保存");
                      return;
                    }
                    btnState.saveLoading = true;
                    try {
                      await saveRemarkCallback?.({ url, token, remark });
                    } finally {
                      btnState.saveLoading = false;
                    }
                  }}
                >
                  保存备注
                </Button>
              </Space>
            </Col>
            <Col span={8}>
              <Form.Item name="handwritingModel" label="模型ID">
                <Input
                  placeholder="请输入模型ID"
                  allowClear
                  variant="filled"
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="remark" label="备注">
                <Input
                  placeholder="请输入备注"
                  allowClear
                  variant="filled"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const { url, token, remark } = form.getFieldsValue();
                      if (!url || !token) {
                        message.error("URL和Token都没填，保存个寂寞");
                        return;
                      }
                      if (!remark) {
                        message.warning("备注为空，写点东西再保存");
                        return;
                      }
                      saveRemarkCallback?.({ url, token, remark });
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </ConfigProvider>
  );
}
