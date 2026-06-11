import { useReactive, useMemoizedFn } from "ahooks";
import { Input, Checkbox, Radio, Modal, Button, message } from "antd";
import { useEffect } from "react";
import styles from "./index.module.less";

// Curl 单项子组件
const CurlItem = ({ model, curl, onCopy }) => {
  return (
    <div className={styles.curlItem}>
      <div className={styles.curlHeader}>
        <span className={styles.modelName}>{model}</span>
        <Button size="small" onClick={() => onCopy(curl)}>
          复制
        </Button>
      </div>
      <pre className={styles.curlCode}>{curl}</pre>
    </div>
  );
};

// 配置表单区域子组件
const ConfigForm = ({
  state,
  onFetchModels,
  onAddModel,
  onToggleModel,
  onSelectAll,
  onClearAll,
  onFilterModels,
}) => {
  return (
    <div className={styles.formSection}>
      <Input
        placeholder="URL"
        value={state.url}
        onChange={(e) => (state.url = e.target.value)}
        variant="underlined"
        size="large"
        className={styles.input}
      />
      <Input
        placeholder="Token"
        value={state.token}
        onChange={(e) => (state.token = e.target.value)}
        className={styles.input}
        variant="underlined"
        size="large"
      />
      <Input
        placeholder="Name"
        value={state.name}
        onChange={(e) => (state.name = e.target.value)}
        className={styles.input}
        variant="underlined"
        size="large"
      />
      <Input
        placeholder="备注"
        value={state.remark}
        onChange={(e) => (state.remark = e.target.value)}
        className={styles.input}
        variant="underlined"
        size="large"
      />
      <div style={{ display: "flex", gap: "8px" }}>
        <Button
          type="primary"
          onClick={onFetchModels}
          className={styles.fetchBtn}
          size="large"
        >
          拉取模型列表
        </Button>
        <Button
          type="primary"
          onClick={() => {
            state.url = "";
            state.token = "";
            state.name = "";
            state.remark = "";
            state.models = [];
            state.selectedModels = [];
          }}
          size="large"
        >
          重置
        </Button>
      </div>
      <div className={styles.addModelSection}>
        <Input
          placeholder="手动添加模型"
          value={state.newModelName}
          onChange={(e) => (state.newModelName = e.target.value)}
          onPressEnter={onAddModel}
          className={styles.addInput}
          variant="underlined"
          size="large"
        />
        <Button onClick={onAddModel} size="large">
          添加
        </Button>
      </div>
      <div className={styles.modelActions}>
        <Button size="small" onClick={onSelectAll}>
          全部
        </Button>
        <Button size="small" onClick={() => onFilterModels("gpt")}>
          GPT
        </Button>
        <Button size="small" onClick={() => onFilterModels("claude")}>
          Claude
        </Button>
        <Button size="small" onClick={() => onFilterModels("gemini")}>
          Gemini
        </Button>
        <Button size="small" onClick={onClearAll}>
          清空
        </Button>
      </div>
      <div className={styles.modelList}>
        {state.models.length === 0 ? (
          <div className={styles.empty}>暂无模型</div>
        ) : (
          state.models.map((model) => (
            <div key={model} className={styles.modelItem}>
              <Checkbox
                checked={state.selectedModels.includes(model)}
                onChange={() => onToggleModel(model)}
              >
                {model}
              </Checkbox>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Curl 展示区域子组件
const CurlDisplay = ({ state, onGenerate, onCopy, handleOpenModal }) => {
  return (
    <div className={styles.curlSection}>
      <Radio.Group
        value={state.curlType}
        onChange={(e) => (state.curlType = e.target.value)}
        className={styles.radioGroup}
      >
        <Radio.Button value="chat">Chat</Radio.Button>
        <Radio.Button value="codex">Codex</Radio.Button>
        <Radio.Button value="claude-code">Claude Code</Radio.Button>
      </Radio.Group>
      <Button
        type="primary"
        onClick={onGenerate}
        className={styles.generateBtn}
      >
        生成并保存
      </Button>

      <Button onClick={handleOpenModal}>管理</Button>

      <div className={styles.curlList}>
        {state.curls.length === 0 ? (
          <div className={styles.empty}>配置完成后点击"生成并保存"</div>
        ) : (
          state.curls.map((item) => (
            <CurlItem
              key={item.model}
              model={item.model}
              curl={item.curl}
              onCopy={onCopy}
            />
          ))
        )}
      </div>
    </div>
  );
};

// 配置管理弹窗子组件
const ConfigModal = ({
  visible,
  configs,
  onClose,
  onLoad,
  onDelete,
  onExport,
  onImport,
}) => {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title="配置管理"
      className={styles.modal}
      width={900}
    >
      <div className={styles.modalActions}>
        <Button onClick={onExport}>导出</Button>
        <label>
          <Button>导入</Button>
          <input
            type="file"
            accept=".json"
            onChange={onImport}
            style={{ display: "none" }}
          />
        </label>
      </div>
      <div className={styles.configList}>
        {configs.length === 0 ? (
          <div className={styles.empty}>暂无配置</div>
        ) : (
          configs.map((config) => (
            <div key={config.id} className={styles.configItem}>
              <div className={styles.configItemHeader}>
                <div className={styles.configName}>{config.name}</div>
                <div className={styles.configActions}>
                  <Button size="small" onClick={() => onLoad(config)}>
                    加载
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => onDelete(config.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
              <div className={styles.configInfo}>
                <div className={styles.configField}>
                  <div className={styles.configLabel}>URL</div>
                  <div className={styles.configValue}>{config.url}</div>
                </div>
                <div className={styles.configField}>
                  <div className={styles.configLabel}>Token</div>
                  <div className={styles.configValue}>
                    {config.token?.slice(0, 20)}...
                  </div>
                </div>
                <div className={styles.configField}>
                  <div className={styles.configLabel}>备注</div>
                  <div className={styles.configValue}>
                    {config.remark || "-"}
                  </div>
                </div>
                <div className={styles.configField}>
                  <div className={styles.configLabel}>模型数量</div>
                  <div className={styles.configValue}>
                    {config.models?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

// 主组件
const ModelConfigManager = () => {
  // 本地状态管理
  const state = useReactive({
    url: "https://muyuan.do",
    token: "sk-gCfqDzPmsRXjbIKCa1v86x5swTmzgmgf4LUq0t0SH1meP0oN",
    name: "",
    remark: "",
    models: [],
    modelsBak: [],
    selectedModels: [],
    curlType: "chat",
    curls: [],
    modalVisible: false,
    configs: [],
    newModelName: "",
  });

  // 从 localStorage 加载配置列表
  useEffect(() => {
    const saved = localStorage.getItem("model_configs");
    if (saved) {
      state.configs = JSON.parse(saved);
    }
  }, []);

  // 拉取模型列表
  const handleFetchModels = useMemoizedFn(async () => {
    if (!state.url || !state.token) {
      message.error("请先填写 URL 和 Token");
      return;
    }
    try {
      const res = await fetch(`${state.url}/v1/models`, {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      const data = await res.json();
      state.models = data.data?.map((m) => m.id) || [];
      state.modelsBak = [...state.models];
      message.success("拉取成功");
    } catch (err) {
      message.error("拉取失败");
    }
  });

  // 手动添加模型
  const handleAddModel = useMemoizedFn(() => {
    if (!state.newModelName) return;
    if (state.models.includes(state.newModelName)) {
      message.warning("模型已存在");
      return;
    }
    state.models.push(state.newModelName);
    state.modelsBak = [...state.models];
    state.newModelName = "";
  });

  // 切换模型选中状态
  const handleToggleModel = useMemoizedFn((model) => {
    if (state.selectedModels.includes(model)) {
      state.selectedModels = state.selectedModels.filter((m) => m !== model);
    } else {
      state.selectedModels.push(model);
    }
  });

  // 全选模型
  const handleSelectAll = useMemoizedFn(() => {
    state.models = state.modelsBak;
  });

  // 快捷筛选模型
  const handleFilterModels = useMemoizedFn((filter) => {
    const filtered = state.models.filter((m) =>
      m.toLowerCase().includes(filter.toLowerCase()),
    );
    state.models = filtered;
  });

  // 清空选择
  const handleClearAll = useMemoizedFn(() => {
    state.selectedModels = [];
  });

  // 生成 curl 模板
  const generateCurlTemplate = useMemoizedFn((type, model) => {
    const templates = {
      chat: (model) => `curl -sS '${state.url}/v1/chat/completions' \\
  -X POST \\
  -H 'content-type: application/json' \\
  -H 'authorization: Bearer ${state.token}' \\
  --data-binary '{
  "model": "${model}",
  "messages": [
    {
      "role": "user",
      "content": "just say hi, nothing else"
    }
  ]
}'`,

      codex: (model) => `curl -sS '${state.url}/v1/responses' \\
  -X POST \\
  -H 'content-type: application/json' \\
  -H 'authorization: Bearer ${state.token}' \\
  --data-binary '{
  "model": "${model}",
  "input": "just say hi, nothing else"
}'`,

      "claude-code": (model) => `curl -sS '${state.url}/v1/messages' \\
  -X POST \\
  -H 'content-type: application/json' \\
  -H 'x-api-key: ${state.token}' \\
  -H 'anthropic-version: 2023-06-01' \\
  -H 'anthropic-dangerous-direct-browser-access: true' \\
  --data-binary '{
  "model": "${model}",
  "max_tokens": 64,
  "metadata": {
    "user_id": "{\\"device_id\\":\\"298863f3680a5437d5770973d49a9f941c9673bf21f1175468a0ba22be09cd24\\",\\"account_uuid\\":\\"7b67e64a-c8c3-418b-b9ae-94fa744f1f9b\\",\\"session_id\\":\\"bc811773-a80b-40ab-83c9-a721b83ae308\\"}"
  },
  "messages": [
    {
      "role": "user",
      "content": "just say hi, nothing else"
    }
  ]
}'`,
    };
    return templates[type](model);
  });

  // 生成并保存配置
  const handleGenerate = useMemoizedFn(() => {
    if (!state.url || !state.token || !state.name) {
      message.error("请填写完整的 URL、Token 和 Name");
      return;
    }
    if (state.selectedModels.length === 0) {
      message.error("请至少选择一个模型");
      return;
    }

    // 生成 curl
    state.curls = state.selectedModels.map((model) => ({
      model,
      curl: generateCurlTemplate(state.curlType, model),
    }));

    // 保存到 localStorage
    const id = btoa(state.url + state.token);
    const config = {
      id,
      url: state.url,
      token: state.token,
      name: state.name,
      remark: state.remark,
      models: state.selectedModels,
    };

    const updated = state.configs.filter((c) => c.id !== id);
    updated.push(config);
    state.configs = updated;
    localStorage.setItem("model_configs", JSON.stringify(updated));

    message.success("生成并保存成功");
  });

  // 复制到剪贴板
  const handleCopy = useMemoizedFn((text) => {
    navigator.clipboard.writeText(text);
    message.success("已复制");
  });

  // 打开弹窗
  const handleOpenModal = useMemoizedFn(() => {
    state.modalVisible = true;
  });

  // 关闭弹窗
  const handleCloseModal = useMemoizedFn(() => {
    state.modalVisible = false;
  });

  // 加载配置
  const handleLoadConfig = useMemoizedFn((config) => {
    state.url = config.url;
    state.token = config.token;
    state.name = config.name;
    state.remark = config.remark || "";
    state.selectedModels = config.models || [];
    state.modalVisible = false;
    message.success("加载成功");
  });

  // 删除配置
  const handleDeleteConfig = useMemoizedFn((id) => {
    state.configs = state.configs.filter((c) => c.id !== id);
    localStorage.setItem("model_configs", JSON.stringify(state.configs));
    message.success("删除成功");
  });

  // 导出配置
  const handleExport = useMemoizedFn(() => {
    const blob = new Blob([JSON.stringify(state.configs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "model-configs.json";
    a.click();
    message.success("导出成功");
  });

  // 导入配置
  const handleImport = useMemoizedFn((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        state.configs = imported;
        localStorage.setItem("model_configs", JSON.stringify(imported));
        message.success("导入成功");
      } catch (err) {
        message.error("导入失败，文件格式错误");
      }
    };
    reader.readAsText(file);
  });

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.leftPanel}>
          <ConfigForm
            state={state}
            onFetchModels={handleFetchModels}
            onAddModel={handleAddModel}
            onToggleModel={handleToggleModel}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
            onFilterModels={handleFilterModels}
          />
        </div>
        <div className={styles.rightPanel}>
          <CurlDisplay
            state={state}
            onGenerate={handleGenerate}
            onCopy={handleCopy}
            handleOpenModal={handleOpenModal}
          />
        </div>
      </div>
      <ConfigModal
        visible={state.modalVisible}
        configs={state.configs}
        onClose={handleCloseModal}
        onLoad={handleLoadConfig}
        onDelete={handleDeleteConfig}
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  );
};

export default ModelConfigManager;
