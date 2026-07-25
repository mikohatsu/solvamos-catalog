# solvamos-studio patch: hard-fail create + delete + developer console

This Cloud Agent can push to `mikohatsu/solvamos-catalog` only.
Studio changes live as this patch and as a local commit under
`HSJ/solvamos-studio` on branch `cursor/agent-delete-aiapp-fix-a47f`.

## Apply

```bash
cd solvamos-studio
git checkout main
git checkout -b cursor/agent-delete-aiapp-fix-a47f
git am < ../solvamos-catalog/patches/solvamos-studio-agent-delete-aiapp-fix.patch
# or if already on the branch with older commits: git apply --check / reset as needed
```

## Contents

1. **Hard-fail create/update** — any pipeline step failure aborts with error (no warn-and-continue)
2. **Agent delete** — AI App engine + datastore + vault + catalog + DB
3. **AI Applications create fix** — `X-Goog-User-Project`, datastore ready wait, engine ensure
4. **Developer logs** — `/logs` + `GET/DELETE /api/dev/logs`
5. **Evidence dashboard** — `/evidence` chat + citations/hosts/tools from `GET /api/dev/evidence`
