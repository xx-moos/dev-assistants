# OpenAI Compatibility Lab (Frontend)

React + ahooks + axios UI for probing OpenAI-compatible endpoints. It fetches `/v1/models`, lets you select models, and runs text/tools/streaming CLI/image checks while recording status and latency.

## Getting started

```powershell
pnpm install
pnpm --filter @x-dev-assistants/openai-compat-checker dev
```

## Usage flow

1. Enter Base URL and Token (optional if your endpoint is public).
2. Click **Fetch Models** to load `/v1/models`.
3. Select models and the tests to run.
4. Click **Run Tests** to execute and review latency + response previews.

## Notes

- Streaming CLI test uses `stream: true` and SSE parsing in the browser.
- If you see CORS issues, run the UI behind a proxy or from the same domain.
