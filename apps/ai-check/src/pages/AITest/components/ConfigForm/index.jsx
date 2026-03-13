import React from "react";
import { Form, Input, Button, Space, message, Row, Col, Select } from "antd";
import { ApiOutlined, RocketOutlined, CopyOutlined } from "@ant-design/icons";
import styles from "./index.module.less";

const { TextArea } = Input;

export default function ConfigForm({
  form,
  onFetchModels,
  onManualAdd,
  loading,
}) {
  // 艹，复制字段内容的函数
  const copyField = (fieldName, label) => {
    const value = form.getFieldValue(fieldName);
    if (!value) {
      message.warning(`${label}为空，没啥好复制的`);
      return;
    }
    navigator.clipboard.writeText(value);
    message.success(`${label}已复制`);
  };

  return (
    <>
      <Row gutter={[16, 20]}>
        <Col span={4} className={styles.item}>
          <span>url</span>
          <Input size="large" />
        </Col>
        <Col span={4} className={styles.item}>
          <span>token</span>
          <Input size="large" />
        </Col>
        <Col span={4} className={styles.item}>
          <span>name</span>
          <Input size="large" />
        </Col>
        <Col span={1} className={styles.item}>
          <Button
            type="primary"
            loading={loading}
            onClick={() => onFetchModels}
          >
            获取模型
          </Button>
        </Col>
        <Col span={6} className={styles.item}>
          <span>历史</span>
          <Select options={[]} style={{ width: "100%" }}></Select>
        </Col>
        <Col span={2} className={styles.item}>
          <Button type="primary">导出</Button>
          <Button type="primary">导入</Button>
        </Col>

        <Col span={22} className={styles.item}>
          <span>备注</span>
          <Input.TextArea placeholder="备注信息" />
        </Col>
        <Col span={2} className={styles.item}>
          <Button type="primary" onClick={() => {}}>
            保存备注
          </Button>
        </Col>
      </Row>
    </>
  );
}
