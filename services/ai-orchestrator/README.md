# BahiaCred AI Orchestrator

Isolated Cloudflare Worker for authenticated task routing to OpenAI, Anthropic, or both.

## Endpoints
- GET /health — health check.
- POST /v1/tasks — submit a task to one or both model providers.

## Local setup
Requires Node.js 20+.
1. Run npm install in this directory.
2. Copy .dev.vars.example to .dev.vars and set local credentials.
3. Run npm run typecheck.
4. Run npm run dev.

## Example payload
{
  "objective": "Review this synthetic API design and identify security risks",
  "context": "Example-only data; no real customer information.",
  "acceptanceCriteria": ["List risks", "Suggest mitigations"],
  "provider": "both",
  "classification": "internal"
}

Send it to POST /v1/tasks with Authorization: Bearer <token>.

## Safety boundary
- API keys are server-side only.
- Confidential tasks are blocked in this initial version.
- No customer database, MCP tools, write operations, or external business actions are connected.
- The gateway is stateless and does not persist prompts or outputs.
- Configure rate limiting, audit logging with redaction, request timeouts, tests, and staging secrets before deployment.
- Never deploy until privacy/security review and explicit owner approval.
