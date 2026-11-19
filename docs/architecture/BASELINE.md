# BahiaCred Intelligence — Architecture Baseline

## Purpose
Evolve the existing BahiaCred Financeira application into the central operational platform for BahiaCred, integrating other projects incrementally without disrupting production.

## Repository and environment
- Canonical application repository: `bahiacred-emprestimos/bahiacred-financeira`.
- Production/default branch: `main` (protected by process; do not commit implementation changes directly).
- Initial implementation branch: `feature/bahiacred-intelligence-foundation`.
- Existing Supabase project: `tdgftbgxzshogtyhitqw`.
- Existing frontend is a browser application using `js/config.js`, `js/db-adapter.js`, and `js/gate.js`.
- Existing persistence adapter maps logical collections to rows in `public.docs` with `col`, `id`, and `data jsonb`.
- Existing profile data is stored in `public.profiles`; application roles include admin, financeiro, supervisao, and agente.

## Existing data snapshot (read-only inspection)
At the time of baseline inspection:
- `docs`: 536 rows across logical collections.
- `profiles`: 2 rows.
- Logical collections observed: leads, vendas, imports, clients, config, agents, wa_msgs, wa_chats, registro, metas.
- No Supabase Edge Functions were listed.
- No migration history was returned by the connected project tool.
- One public SECURITY DEFINER function was observed: `public.fn_funcao()`.

Counts are a point-in-time diagnostic, not a guarantee of current totals.

## Target architecture
1. Existing BahiaCred Financeira remains the system of record until a separately approved migration plan exists.
2. AI orchestration is a separate backend service; model credentials must never be exposed in browser code.
3. OpenAI and Anthropic are providers behind a provider-neutral task interface.
4. MCP is used for controlled tool access; API calls are used for model inference. MCP connectivity alone does not imply model-to-model communication.
5. Supabase remains the operational database and authentication authority.
6. GitHub branches and pull requests are the review and release mechanism.
7. Cloudflare may host the orchestration service after deployment requirements and secrets management are reviewed.

## Non-goals for this foundation
- No production database schema changes.
- No data migration or deletion.
- No changes to authentication, RLS policies, or existing application behavior.
- No live customer messaging, loan submission, payment, or financial transaction automation.
- No secrets, service-role keys, access tokens, customer PII, or credentials in Git.

## Delivery gates
Every change must be developed on a feature branch, reviewed, tested, and proposed through a pull request. Production deployment and database changes require explicit owner approval.
