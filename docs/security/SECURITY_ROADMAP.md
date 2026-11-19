# Security Review — Initial Findings and Roadmap

## Scope
Read-only inspection of the existing Supabase project and application adapter. This is a preliminary review, not a penetration test or legal compliance certification.

## Observed design
- Browser client initializes Supabase using a publishable key in `js/config.js`. A publishable key is intended for client use; security depends on correct RLS and storage policies.
- `js/db-adapter.js` exposes generic collection operations over `public.docs`.
- `js/gate.js` checks the current session and profile role in the browser.
- RLS policies were observed on `docs` and `profiles`.
- A `SECURITY DEFINER` function named `public.fn_funcao()` is used by policies to resolve the active user's role.

## Preliminary risks to verify
1. RLS policies on `docs` use broad role membership and several logical collections share a single JSONB table. Validate every collection and operation against least-privilege requirements.
2. Policies displayed with role `public` should be reviewed to confirm intended exposure and behavior for anonymous users; do not assume this is exploitable without testing.
3. The SECURITY DEFINER function must be reviewed for ownership, execute grants, fixed search_path, and safe behavior. The observed function has a fixed `search_path = public` and checks `auth.uid()` plus active profile status; still verify grants and policy interaction.
4. The frontend role gate is a user-experience control only. Authorization must remain enforced by RLS and server-side checks.
5. Storage bucket `anexos` and signed URL lifetime/authorization require review. The current adapter requests signed URLs with a one-year expiry; assess whether this is appropriate for sensitive attachments.
6. The project security advisor reported a leaked-password protection configuration warning in the prior diagnostic. Confirm current Auth settings in the dashboard.

## Required follow-up
- Export and review complete schema, grants, RLS policies, storage policies, Auth settings, and database extensions.
- Build a role-by-collection authorization matrix for admin, financeiro, supervisao, agente, and anonymous.
- Test positive and negative access paths with synthetic accounts.
- Review whether personal data should be moved from generic JSONB documents into normalized, purpose-specific tables.
- Define retention, backup, incident response, and access review procedures.

## Change policy
No policy, function, schema, bucket, or Auth setting is changed by this document. Remediation must be a separate reviewed migration/PR with a rollback plan and explicit owner approval.
