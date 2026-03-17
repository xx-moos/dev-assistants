import React from "react";
import { Form, message } from "antd";
import { useEventEmitter, useReactive } from "ahooks";
import styles from "./index.module.less";

import ConfigCard from "./components/ConfigCard";
import CenterCard from "./components/CenterCard";
import ResultPanel from "./components/ResultPanel";
import {
  testClaudeCodeCapability,
  testCodexCliCapability,
  testImageCapability,
  testTextCapability,
} from "../../utils/aiTest";

/** 测试类型 -> API 函数映射 */
const apis = {
  text: testTextCapability,
  image: testImageCapability,
  codex: testCodexCliCapability,
  cc: testClaudeCodeCapability,
};

export default function Index() {
  const [form] = Form.useForm();
  const changeModel = useEventEmitter();
  const changeTestType = useEventEmitter();

  const state = useReactive({
    allModels: [],
    selectedModels: [],
    selectedTestTypes: [],
    results: [],
    testing: false,
  });

  changeModel.useSubscription((value) => {
    state.selectedModels = value;
  });

  /**
   * 点击"开始测试"时触发
   * 并发跑：每个模型 × 每个测试类型，结果实时刷新
   */
  changeTestType.useSubscription(async (testTypes) => {
    state.selectedTestTypes = testTypes;

    const { url, token } = form.getFieldsValue();
    if (!url || !token) {
      message.error("URL 和 Token 不能为空，填好了再来");
      return;
    }

    // 没选模型？手写的也算
    const { handwritingModel } = form.getFieldsValue();
    const modelIds = state.selectedModels.length
      ? [...state.selectedModels]
      : handwritingModel
        ? [handwritingModel]
        : [];

    if (!modelIds.length) {
      message.error("至少选一个模型或手动填写模型ID");
      return;
    }

    if (!testTypes.length) {
      message.error("至少选一个测试类型");
      return;
    }

    // 初始化结果结构：每个模型一个卡片
    state.results = modelIds.map((modelId) => ({
      modelId,
      url,
      token,
      testTypes,
      tests: {},
    }));
    state.testing = true;

    // 并发：所有 模型×测试类型 同时跑
    const promises = modelIds.flatMap((modelId, modelIndex) =>
      testTypes.map(async (type) => {
        const result = await apis[type](url, token, modelId);
        // 实时更新对应模型的对应测试结果
        state.results[modelIndex].tests[type] = result;
      })
    );

    await Promise.allSettled(promises);
    state.testing = false;
  });

  return (
    <div className={styles.container}>
      <div className={styles.center}>
        <ConfigCard
          form={form}
          fetchModelListCallback={(models) => {
            state.allModels = models;
          }}
        />

        <CenterCard
          allModels={state.allModels}
          changeModelCallback={changeModel}
          changeTestTypeCallback={changeTestType}
        />

        <ResultPanel results={state.results} loading={state.testing} />
      </div>
    </div>
  );
}
