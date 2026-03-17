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
  RedoOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import History from "../History";
import { fetchModelList } from "../../../../utils/aiTest";

export default function ConfigCard({ fetchModelListCallback, form }) {

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
              changeCallback={(value) => {
                form.setFieldsValue({
                  url: value?.url,
                  token: value?.token,
                  name: value?.name,
                  remark: value?.remark,
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
          size="middle"
          autoComplete="off"
          form={form}
          initialValues={{
            url: "https://ai.hybgzs.com",
            token:
              "sk-lPBeiYIkGkh59m1_GDWRr2ANunts8T05lSn_MXDK0tdUymqfDzwMFVh8Gy0",
            name: "黑与白",
          }}
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
                  onClick={async () => {
                    if (
                      form.getFieldsValue().url &&
                      form.getFieldsValue().token
                    ) {
                      const res = await fetchModelList(
                        form.getFieldsValue().url,
                        form.getFieldsValue().token
                      );
                      fetchModelListCallback(res || []);
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
                  }}
                  icon={<RedoOutlined />}
                >
                  重置
                </Button>
                <Button type="primary" icon={<SaveOutlined />}>
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
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </ConfigProvider>
  );
}
