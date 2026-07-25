# solvamos-studio patch: agent delete + AI Applications create fix

This Cloud Agent can push to `mikohatsu/solvamos-catalog` only.
Cursor GitHub App does **not** currently have write access to `minvamos/solvamos-studio`
(or the `mikohatsu/solvamos-studio` fork), so the Studio changes live as a patch here
and as a local commit under `HSJ/solvamos-studio` on branch
`cursor/agent-delete-aiapp-fix-a47f`.

## Apply on Studio

```bash
cd /path/to/solvamos-studio
git checkout -b cursor/agent-delete-aiapp-fix-a47f
git apply ../solvamos-catalog/patches/solvamos-studio-agent-delete-aiapp-fix.patch
# or: git am < ../solvamos-catalog/patches/solvamos-studio-agent-delete-aiapp-fix.patch
```

## What it does

1. **Fix AI Applications not appearing on create**
   - Send `X-Goog-User-Project` on Discovery Engine API calls
   - Wait for datastore readiness before engine create
   - Hard-fail create when engine/app is missing (override with `ALLOW_AI_APP_SOFT_FAIL=true`)
   - Chat engine failure falls back to Search app
2. **Agent delete**
   - `DELETE /api/agents/:id` removes AI App engine, datastore, Secret Manager vault, local corpus, catalog listing, and DB row
   - Agents list UI: 삭제 button with confirm
