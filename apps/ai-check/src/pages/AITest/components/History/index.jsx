import React from "react";
import { Button, Select, Space } from "antd";
import { useLocalStorageState } from "ahooks";
import { LOCAL_KEY } from "../../constant";

export default function History(changeCallback) {
  const [history] = useLocalStorageState(LOCAL_KEY, {
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
