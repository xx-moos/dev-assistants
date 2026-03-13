import React, { useState } from "react";
import { Form, message, Checkbox, Card } from "antd";
import {
  ApiOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import ConfigForm from "./components/ConfigForm";
import ModelList from "./components/ModelList";
import TestResults from "./components/TestResults";
import {
  fetchModelList,
  testTextCapability,
  testImageCapability,
  testToolCapability,
  testClaudeCodeCapability,
} from "../../utils/aiTest";
import styles from "./index.module.less";

export default function AITest() {
  const [form] = Form.useForm();
  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [testResults, setTestResults] = useState({});
  const [filterType, setFilterType] = useState("all");
  // 艹，测试类型选择，默认只测文本
  const [testTypes, setTestTypes] = useState(["text"]);

  // 获取模型列表
  const { loading: fetchingModels, run: fetchModels } = useRequest(
    async (values) => {
      const { url, apiKey } = values;
      return await fetchModelList(url, apiKey);
    },
    {
      manual: true,
      onSuccess: (data) => {
        setModels(data);
        message.success(`成功获取 ${data.length} 个模型`);
      },
      onError: (error) => {
        message.error(`获取模型失败: ${error.message}`);
      },
    },
  );

  // 手动添加模型
  const handleManualAdd = () => {
    const modelNames = form.getFieldValue("modelNames") || "";
    const names = modelNames.split("\n").filter((n) => n.trim());
    setModels(names.map((name) => ({ id: name.trim() })));
    message.success(`手动添加了 ${names.length} 个模型`);
  };

  // 艹，测试单个模型，根据选择的测试类型来测
  const testModel = async (modelId, config) => {
    const { url, apiKey } = config;
    const results = { modelId };

    // 初始化测试状态
    testTypes.forEach((type) => {
      results[type] = { status: "testing" };
    });

    setTestResults((prev) => ({ ...prev, [modelId]: results }));

    // 文本测试
    if (testTypes.includes("text")) {
      results.text = await testTextCapability(url, apiKey, modelId);
      setTestResults((prev) => ({ ...prev, [modelId]: { ...results } }));
    }

    // 图像测试
    if (testTypes.includes("image")) {
      results.image = await testImageCapability(url, apiKey, modelId);
      setTestResults((prev) => ({ ...prev, [modelId]: { ...results } }));
    }

    // 工具调用测试
    if (testTypes.includes("tool")) {
      results.tool = await testToolCapability(url, apiKey, modelId);
      setTestResults((prev) => ({ ...prev, [modelId]: { ...results } }));
    }

    // ClaudeCode测试
    if (testTypes.includes("claudecode")) {
      results.claudecode = await testClaudeCodeCapability(url, apiKey, modelId);
      setTestResults((prev) => ({ ...prev, [modelId]: { ...results } }));
    }

    return results;
  };

  // 批量测试
  const { loading: testing, run: runTests } = useRequest(
    async () => {
      // 艹，没选测试类型就想测试？做梦呢
      if (testTypes.length === 0) {
        message.warning("至少选择一个测试类型！");
        throw new Error("未选择测试类型");
      }

      const config = form.getFieldsValue();
      const results = {};

      for (const modelId of selectedModels) {
        results[modelId] = await testModel(modelId, config);
      }

      return results;
    },
    {
      manual: true,
      onSuccess: () => {
        message.success("所有测试完成！");
      },
      onError: (error) => {
        if (error.message !== "未选择测试类型") {
          message.error(`测试失败: ${error.message}`);
        }
      },
    },
  );

  // 切换模型选择
  const toggleModelSelection = (modelId) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId],
    );
  };

  // 艹，复制测试结果，根据实际测试的类型来复制
  const copyResult = (modelId) => {
    const result = testResults[modelId];
    if (!result) return;

    const config = form.getFieldsValue();
    let text = `模型: ${modelId}\nAPI地址: ${config.url}\n配置名称: ${config.name || "未命名"}\n备注: ${config.remark || "无"}\n\n`;

    // 文本测试
    if (result.text) {
      text += `文本测试: ${result.text.status === "success" ? "✓ 通过" : "✗ 失败"}\n`;
      text += `${result.text.content || result.text.error || ""}\n\n`;
    }

    // 图像测试
    if (result.image) {
      text += `图像测试: ${result.image.status === "success" ? "✓ 通过" : "✗ 失败"}\n`;
      text += `${result.image.content || result.image.error || ""}\n\n`;
    }

    // 工具调用测试
    if (result.tool) {
      text += `工具调用测试: ${result.tool.status === "success" ? "✓ 通过" : "✗ 失败"}\n`;
      text += `${result.tool.content || result.tool.error || ""}\n\n`;
    }

    // ClaudeCode测试
    if (result.claudecode) {
      text += `ClaudeCode测试: ${result.claudecode.status === "success" ? "✓ 通过" : "✗ 失败"}\n`;
      text += `${result.claudecode.content || result.claudecode.error || ""}`;
    }

    navigator.clipboard.writeText(text);
    message.success("测试结果已复制到剪贴板");
  };

  // 艹，复制成功的模型配置
  const copySuccessModels = () => {
    const successModels = Object.entries(testResults)
      .filter(([_, result]) => {
        // 只要有任何一个测试成功就算成功
        return Object.keys(result)
          .filter((key) => key !== "modelId")
          .some((key) => result[key]?.status === "success");
      })
      .map(([modelId]) => modelId);

    if (successModels.length === 0) {
      message.warning("没有测试成功的模型");
      return;
    }

    const config = form.getFieldsValue();
    const text = JSON.stringify(
      {
        url: config.url,
        apiKey: config.apiKey,
        name: config.name,
        remark: config.remark,
        models: successModels,
      },
      null,
      2,
    );

    navigator.clipboard.writeText(text);
    message.success(`已复制 ${successModels.length} 个成功模型的配置`);
  };

  const getModelType = (modelId) => {
    const name = modelId.toLowerCase();
    if (name.includes("gpt") || name.includes("openai")) return "gpt";
    if (name.includes("claude")) return "claude";
    if (name.includes("gemini")) return "gemini";
    return "other";
  };

  const filteredModels = models.filter((model) => {
    if (filterType === "all") return true;
    return getModelType(model.id) === filterType;
  });

  return (
    <div className={styles.container}>
      <div className={styles.mainCard}>
        {/* 配置表单 */}
        <div className={styles.section}>
          <Card title="配置">
            <ConfigForm
              form={form}
              onFetchModels={fetchModels}
              onManualAdd={handleManualAdd}
              loading={fetchingModels}
            />
          </Card>
        </div>

        {/* 艹，测试类型选择 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <CheckCircleOutlined /> 测试类型
          </div>
          <div className={styles.testTypeSelector}>
            <Checkbox.Group
              value={testTypes}
              onChange={setTestTypes}
              style={{ width: "100%" }}
            >
              <Checkbox value="text">文本测试</Checkbox>
              <Checkbox value="image">图像测试</Checkbox>
              <Checkbox value="tool">工具调用测试</Checkbox>
              <Checkbox value="claudecode">ClaudeCode测试</Checkbox>
            </Checkbox.Group>
          </div>
        </div>

        {/* 模型列表 */}
        {models.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <MessageOutlined /> 模型列表 ({filteredModels.length})
            </div>
            <ModelList
              models={models}
              selectedModels={selectedModels}
              testResults={testResults}
              filterType={filterType}
              testing={testing}
              onFilterChange={setFilterType}
              onToggleModel={toggleModelSelection}
              onRunTests={runTests}
              onSelectAll={() =>
                setSelectedModels(filteredModels.map((m) => m.id))
              }
              onClearSelection={() => setSelectedModels([])}
              onCopySuccess={copySuccessModels}
            />
          </div>
        )}

        {/* 测试结果 */}
        {Object.keys(testResults).length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <CheckCircleOutlined /> 测试结果
            </div>
            <TestResults testResults={testResults} onCopyResult={copyResult} />
          </div>
        )}

        {/* 空状态 */}
        {models.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.icon}>
              <ApiOutlined />
            </div>
            <p>请先配置API信息并获取模型列表</p>
          </div>
        )}
      </div>
    </div>
  );
}
