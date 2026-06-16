import { useReactive, useMemoizedFn, useRequest } from "ahooks";
import { Input, Checkbox, Radio, Modal, Button, message } from "antd";
import { useEffect, useRef } from "react";
import styles from "./index.module.less";

const MODEL_CONFIG_STORAGE_KEY = "model_configs";
const FETCH_MODELS_FAILED = "FETCH_MODELS_FAILED";
const CONFIG_MODAL_WIDTH = '80%';

// 生成配置id
const createConfigId = (url, token) => `${url}-${token}`;

// 保存缓存
const saveStoredConfigs = (configs) => {
  localStorage.setItem(MODEL_CONFIG_STORAGE_KEY, JSON.stringify(configs));
};

// 请求模型
const getModelList = async (url, token) => {
  const response = await fetch(`${url}/v1/models`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // 响应边界
  if (!response.ok) {
    throw new Error(FETCH_MODELS_FAILED);
  }

  const payload = await response.json();

  // 格式边界
  if (!Array.isArray(payload?.data)) {
    return [];
  }

  return payload.data.map((modelItem) => modelItem.id).filter(Boolean);
};

// Curl项
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

// 配置表单
const ConfigForm = ({
  state,
  isFetching,
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
          loading={isFetching}
        >
          拉取模型列表
        </Button>
        <Button
          type="primary"
          className={styles.fetchBtn}
          onClick={() => {
            state.url = "";
            state.token = "";
            state.name = "";
            state.remark = "";
            state.models = [];
            state.modelsBak = [];
            state.selectedModels = [];
            state.curls = [];
          }}
          size="large"
        >
          重置全部
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

// Curl展示
const CurlDisplay = ({ state, onGenerate, onCopy }) => {
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

// 配置行
const ConfigRow = ({ config, onLoad, onDelete, onSave }) => {
  const draft = useReactive({
    name: config.name || "",
    url: config.url || "",
    token: config.token || "",
    remark: config.remark || "",
  });

  // 同步草稿
  useEffect(() => {
    draft.name = config.name || "";
    draft.url = config.url || "";
    draft.token = config.token || "";
    draft.remark = config.remark || "";
  }, [config]);

  // 修改名称
  const changeName = useMemoizedFn((event) => {
    draft.name = event.target.value;
  });

  // 修改地址
  const changeUrl = useMemoizedFn((event) => {
    draft.url = event.target.value;
  });

  // 修改地址
  const changeToken = useMemoizedFn((event) => {
    draft.token = event.target.value;
  });

  // 修改备注
  const changeRemark = useMemoizedFn((event) => {
    draft.remark = event.target.value;
  });

  // 保存行
  const saveRow = useMemoizedFn(() => {
    onSave(config.id, {
      ...config,
      name: draft.name,
      url: draft.url,
      remark: draft.remark,
    });
  });

  // 加载行
  const loadRow = useMemoizedFn(() => {
    onLoad(config);
  });

  // 删除行
  const deleteRow = useMemoizedFn(() => {
    onDelete(config.id);
  });

  return (
    <div className={styles.configItem}>
      <Input
        size="large"
        value={draft.name}
        onChange={changeName}
        placeholder="Name"
        aria-label="配置名称"
      />
      <Input
        size="large"
        value={draft.url}
        onChange={changeUrl}
        placeholder="URL"
        aria-label="配置 URL"
      />
      <Input
        size="large"
        value={draft.token}
        onChange={changeToken}
        placeholder="Token"
        aria-label="配置 Token"
      />
      <Input
        size="large"
        value={draft.remark}
        onChange={changeRemark}
        placeholder="备注"
        aria-label="配置备注"
      />
      <div className={styles.configActions}>
        <a onClick={loadRow}>
          加载
        </a>
        <a onClick={saveRow}>
          保存
        </a>
        <a onClick={deleteRow}>
          删除
        </a>
      </div>
    </div>
  );
};

// 管理弹窗
const ConfigModal = ({
  visible,
  configs,
  onClose,
  onLoad,
  onDelete,
  onSave,
  onExport,
  onImport,
}) => {

  const fileInputRef = useRef(null);

  // 渲染配置
  const renderConfig = useMemoizedFn((config) => (
    <ConfigRow
      key={config.id}
      config={config}
      onLoad={onLoad}
      onDelete={onDelete}
      onSave={onSave}
    />
  ));

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title="配置管理"
      className={styles.modal}
      width={CONFIG_MODAL_WIDTH}
    >
      <div className={styles.modalActions}>
        <Button onClick={onExport}>导出</Button>
        <label>
          <Button onClick={() => {
            fileInputRef.current.click();
          }}>导入</Button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={onImport}
            style={{ display: "none" }}
          />
        </label>
      </div>
      <div className={styles.configList}>
        {configs.length === 0 ? (
          <div className={styles.empty}>暂无配置</div>
        ) : (
          <>
            <div className={styles.configHeader}>
              <span>Name</span>
              <span>URL</span>
              <span>TOKEN</span>
              <span>备注</span>
              <span>操作</span>
            </div>
            <div className={styles.configRows}>{configs.map(renderConfig)}</div>
          </>
        )}
      </div>
    </Modal>
  );
};

// 主组件
const ModelConfigManager = () => {
  // 本地状态
  const state = useReactive({
    url: "",
    token: "",
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
  const { runAsync: requestModels, loading: isFetching } = useRequest(
    getModelList,
    {
      manual: true,
    },
  );

  // 读取缓存
  useEffect(() => {
    const saved = localStorage.getItem(MODEL_CONFIG_STORAGE_KEY);
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
      const modelList = await requestModels(state.url, state.token);
      state.models = modelList;
      state.modelsBak = [...state.models];
      message.success("拉取成功");
    } catch (error) {
      message.error("拉取失败");
    }
  });

  // 添加模型
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

  // 切换模型
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

  // 筛选模型
  const handleFilterModels = useMemoizedFn((filter) => {
    const filtered = state.models.filter((m) =>
      m.toLowerCase().includes(filter.toLowerCase()),
    );
    state.models = filtered;
  });

  // 清空选择
  const handleClearAll = useMemoizedFn(() => {
    state.selectedModels = [];
    state.models = [...state.modelsBak];
  });

  // 生成模板
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

  // 生成保存
  const handleGenerate = useMemoizedFn(() => {
    if (!state.url || !state.token) {
      message.error("请填写完整的 URL 和 Token");
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

    // 写入缓存
    const id = createConfigId(state.url, state.token);
    const config = {
      id,
      url: state.url,
      token: state.token,
      name: state.name,
      remark: state.remark,
    };

    const updated = state.configs.filter((c) => c.id !== id);
    updated.push(config);
    state.configs = updated;
    saveStoredConfigs(updated);

    message.success("生成并保存成功");
  });

  // 复制文本
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

  // 保存配置
  const handleSaveConfig = useMemoizedFn((configId, config) => {
    const name = config.name.trim();
    const url = config.url.trim();
    const token = (config.token || "").trim();
    const remark = config.remark.trim();
    const hasBaseConfig = Boolean(url && name);
    const hasToken = Boolean(token);

    // 可见必填
    if (!hasBaseConfig) {
      message.error("请填写完整的 URL 和 Name");
      return;
    }

    // 历史边界
    if (!hasToken) {
      message.error("当前配置缺少 Token，请重新生成");
      return;
    }

    const savedConfig = {
      ...config,
      id: createConfigId(url, token),
      name,
      url,
      token,
      remark,
    };
    const hasSameConfig = state.configs.some(
      (storedConfig) =>
        storedConfig.id !== configId && storedConfig.id === savedConfig.id,
    );

    // 重复边界
    if (hasSameConfig) {
      message.error("相同 URL 和 Token 已存在");
      return;
    }

    const configs = state.configs.map((storedConfig) =>
      storedConfig.id === configId ? savedConfig : storedConfig,
    );
    state.configs = configs;
    saveStoredConfigs(configs);
    message.success("保存成功");
  });

  // 删除配置
  const handleDeleteConfig = useMemoizedFn((id) => {
    state.configs = state.configs.filter((c) => c.id !== id);
    saveStoredConfigs(state.configs);
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
        saveStoredConfigs(imported);
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
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 20 }}> ai curl</span>
            <Button onClick={handleOpenModal}>管理</Button>
          </div>
          <ConfigForm
            state={state}
            isFetching={isFetching}
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
          />
        </div>
      </div>
      <ConfigModal
        visible={state.modalVisible}
        configs={state.configs}
        onClose={handleCloseModal}
        onLoad={handleLoadConfig}
        onDelete={handleDeleteConfig}
        onSave={handleSaveConfig}
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  );
};

export default ModelConfigManager;
