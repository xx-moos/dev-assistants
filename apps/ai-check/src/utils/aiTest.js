import axios from "axios";

// 文本测试
export const testTextCapability = async (url, apiKey, modelId) => {
  try {
    const response = await axios.post(
      `${url}/v1/chat/completions`,
      {
        model: modelId,
        messages: [{ role: "user", content: "用一句话回答0.9和0.111谁大" }],
        max_tokens: 100,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 30000,
      }
    );

    // 艹，安全检查，防止SB数据结构出问题
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error("返回数据格式错误");
    }

    return {
      status: "success",
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  } catch (error) {
    return {
      status: "failed",
      error: error.message,
    };
  }
};

// 图像测试
export const testImageCapability = async (url, apiKey, modelId) => {
  try {
    const response = await axios.post(
      `${url}/v1/chat/completions`,
      {
        model: modelId,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "这张图片里有什么？" },
              {
                type: "image_url",
                image_url: {
                  url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                },
              },
            ],
          },
        ],
        max_tokens: 100,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 30000,
      }
    );

    // 艹，安全检查
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error("返回数据格式错误");
    }

    return {
      status: "success",
      content: response.data.choices[0].message.content,
    };
  } catch (error) {
    return {
      status: "failed",
      error: error.message,
    };
  }
};

// codex 调用测试
export const testCodexCliCapability = async (url, apiKey, modelId) => {
  try {
    const response = await axios.post(
      `${url}/v1/responses`,
      {
        model: modelId,
        input: "使用计算工具计算 0.2 + 0.1 是多少? ",
        tools: [
          {
            type: "function",
            name: "calculator",
            description: "Performs arithmetic",
            parameters: {
              type: "object",
              properties: {
                expression: { type: "string" },
              },
              required: ["expression"],
            },
          },
        ],
        stream: true,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 30000,
      }
    );

    // 艹，安全检查
    if (!response.data?.choices?.[0]?.message) {
      throw new Error("返回数据格式错误");
    }

    const hasToolCall = response.data.choices[0].message.tool_calls?.length > 0;
    return {
      status: hasToolCall ? "success" : "failed",
      content: hasToolCall
        ? JSON.stringify(response.data.choices[0].message.tool_calls, null, 2)
        : "模型未调用工具",
      hasToolCall,
    };
  } catch (error) {
    return {
      status: "failed",
      error: error.message,
    };
  }
};

// ClaudeCode测试 - 测试代码生成能力
export const testClaudeCodeCapability = async (url, apiKey, modelId) => {
  try {
    const response = await axios.post(
      `${url}/v1/messages`,
      {
        model: modelId,
        messages: [
          {
            role: "user",
            content:
              "一句代码,用JavaScript写一个快速排序函数，要求代码简洁优雅",
          },
        ],
        max_tokens: 500,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        timeout: 30000, // 30 秒超时
      }
    );

    // 艹，安全检查
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error("返回数据格式错误");
    }

    const content = response.data.choices[0].message.content;
    // 检查是否包含代码块
    const hasCode =
      content.includes("```") ||
      content.includes("function") ||
      content.includes("=>");

    return {
      status: hasCode ? "success" : "failed",
      content: content,
      usage: response.data.usage,
      hasCode,
    };
  } catch (error) {
    return {
      status: "failed",
      error: error.message,
    };
  }
};

// 获取模型列表
export const fetchModelList = async (url, apiKey) => {
  const response = await axios.get(`${url}/v1/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return response.data.data || [];
};
