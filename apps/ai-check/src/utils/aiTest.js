import axios from "axios";
const MAX_TIME = 5 * 1000;

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
        timeout: MAX_TIME,
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
        timeout: MAX_TIME,
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

// codex 调用测试 - 使用 OpenAI Responses API
export const testCodexCliCapability = async (url, apiKey, modelId) => {
  try {
    const response = await axios.post(
      `${url}/v1/responses`,
      {
        model: modelId,
        input: "使用计算工具计算3+2-5是多少? ",
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
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: MAX_TIME,
      }
    );

    // Responses API 返回的是 output 数组，别tm用 choices 格式去解析
    if (!response.data?.output) {
      throw new Error("返回数据格式错误");
    }

    const output = response.data.output;

    // 捞工具调用
    const toolCalls = output.filter((item) => item.type === "function_call");
    const hasToolCall = toolCalls.length > 0;

    // 捞模型的文本回答
    const messageItem = output.find((item) => item.type === "message");
    const textContent = messageItem?.content
      ?.filter((c) => c.type === "output_text")
      .map((c) => c.text)
      .join("") || "";

    return {
      status: hasToolCall ? "success" : "failed",
      content: textContent || (hasToolCall ? "模型调用了工具但未返回文本" : "模型未调用工具"),
      toolCalls: hasToolCall ? toolCalls : [],
      hasToolCall,
    };
  } catch (error) {
    return {
      status: "failed",
      error: error.message,
    };
  }
};

// ClaudeCode测试 - 使用 Anthropic Messages API 测试代码生成能力
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
        timeout: MAX_TIME,
      }
    );

    // Anthropic Messages API 返回 content 数组，别再用 OpenAI 格式解析了
    if (!response.data?.content?.[0]?.text) {
      throw new Error("返回数据格式错误");
    }

    const content = response.data.content[0].text;
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
