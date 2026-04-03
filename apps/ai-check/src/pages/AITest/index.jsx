import React from "react";
import { Form, message } from "antd";
import { useEventEmitter, useLocalStorageState, useReactive } from "ahooks";
import styles from "./index.module.less";

import ConfigCard from "./components/ConfigCard";
import CenterCard from "./components/CenterCard";
import ResultPanel from "./components/ResultPanel";
import { LOCAL_KEY } from "./constant";
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

  const [history, setHistory] = useLocalStorageState(LOCAL_KEY, {
    defaultValue: [],
  });

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
    const modelIds = [...state.selectedModels].concat(
      handwritingModel?.split(",") || []
    );

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

    // 测试跑完了，自动把当前配置存到历史记录
    const { name, remark } = form.getFieldsValue();
    const configName = name || `${url.slice(0, 20)}...`;
    const newEntry = {
      id: Date.now().toString(),
      url,
      token,
      name: configName,
      remark: remark || "",
      createdAt: new Date().toISOString(),
    };

    // 同url+token的记录直接覆盖，别搞一堆重复的
    const filtered = history.filter(
      (h) => !(h.url === url && h.token === token)
    );
    setHistory([newEntry, ...filtered]);
    message.success("测试完成，配置已自动保存到历史记录");
  });

  return (
    <div className={styles.container}>
      <div className={styles.center}>
        <ConfigCard
          form={form}
          history={history}
          setHistory={setHistory}
          fetchModelListCallback={(models) => {
            state.allModels = models;
          }}
          saveRemarkCallback={({ url, token, remark }) => {
            const idx = history.findIndex(
              (h) => h.url === url && h.token === token
            );
            if (idx === -1) {
              // 历史记录里没有这条，直接新建一条塞进去
              const { name } = form.getFieldsValue();
              setHistory([
                {
                  id: Date.now().toString(),
                  url,
                  token,
                  name: name || url.slice(0, 20),
                  remark,
                  createdAt: new Date().toISOString(),
                },
                ...history,
              ]);
              message.success("备注已保存（新建历史记录）");
            } else {
              const updated = [...history];
              updated[idx] = { ...updated[idx], remark };
              setHistory(updated);
              message.success("备注已更新");
            }
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
