# AI Orchestrator — Integration Contract

## Objective
Provide one controlled workflow for ChatGPT/OpenAI and Claude/Anthropic to collaborate on BahiaCred projects, with traceable tasks, explicit permissions, and human approval gates.

## Important distinction
- MCP exposes tools and resources to an AI client.
- OpenAI API and Anthropic API provide model inference.
- A shared MCP server does not automatically make ChatGPT and Claude talk to each other.
- A backend orchestrator must explicitly call the selected model provider(s), pass minimized task context, collect outputs, and record the run.

## Proposed components
- Orchestrator API: TypeScript service, initially provider-neutral.
- Provider adapters: OpenAI and Anthropic implementations, isolated behind a common interface.
- Task store: metadata and status in a dedicated schema/table only after schema review and approval.
- Tool gateway: allowlisted MCP/API tools, scoped by role and task.
- Audit trail: actor, task ID, provider/model identifier, tool names, timestamps, approval state, and outcome. Never log secrets or full sensitive customer payloads.

## Initial workflow
1. An authorized BahiaCred user submits a task.
2. Orchestrator classifies the task and checks authorization.
3. It removes or masks unnecessary personal and financial data.
4. It sends the task to the designated model.
5. For cross-review, it sends the first model's output to the second model with the acceptance criteria.
6. It records the results and differences.
7. A human reviews and approves any action that changes production, customer records, proposals, contracts, communications, or financial data.

## Provider interface (conceptual)
```ts
type ModelTask = {
  taskId: string;
  objective: string;
  context: string;
  acceptanceCriteria: string[];
  allowedTools: string[];
  sensitivity: "public" | "internal" | "confidential";
};

type ModelResult = {
  provider: "openai" | "anthropic";
  model: string;
  output: string;
  warnings: string[];
};

interface ModelProvider {
  run(task: ModelTask): Promise<ModelResult>;
}
```

## Security requirements
- API keys stored only in server-side secret storage.
- No model API key in frontend JavaScript, Git, logs, or prompts.
- Per-provider spend and rate limits.
- Explicit allowlist of tools and operations.
- Read-only mode as the default.
- Human approval required for writes and external side effects.
- Retention limits and redaction for task history.
- Do not send CPF, identity documents, bank details, health data, or full customer records unless strictly necessary, authorized, and protected by an approved data-processing design.

## Rollout
Phase A: architecture and provider contract only.
Phase B: local/staging proof of concept using synthetic data.
Phase C: read-only integrations and audit.
Phase D: narrowly scoped write actions with approval.
Phase E: production rollout after security, legal, and owner review.

## Open decisions
- Confirm API access and billing for OpenAI and Anthropic.
- Confirm the Claude MCP server's endpoint, authentication method, and tool scope; do not assume the current Claude MCP connection is visible to ChatGPT.
- Select hosting and secrets manager.
- Define data retention, model selection, and budget limits.
- Decide whether cross-review is mandatory for code, financial rules, and customer-facing content.
