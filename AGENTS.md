## Superpowers System

<EXTREMELY_IMPORTANT>
You have superpowers. Superpowers teach you new skills and capabilities. RIGHT NOW run: ~/.codex/superpowers/.codex/superpowers-codex bootstrap and follow the instructions it returns.
</EXTREMELY_IMPORTANT>

## Git Network Rules

<EXTREMELY_IMPORTANT>
Any git operation that touches the network must use the user's proxy.
</EXTREMELY_IMPORTANT>

- Before running `git fetch`, `git pull`, `git push`, `git clone`, `git ls-remote`, or any other remote git command, first check whether the proxy is configured through:
  - git `http.proxy` / `https.proxy`
  - environment variables such as `http_proxy`, `https_proxy`, `HTTP_PROXY`, `HTTPS_PROXY`
- On this machine, if no repo-local proxy is already configured, prefer `http://127.0.0.1:7890` for both `http.proxy` and `https.proxy`.
- If no proxy is configured, do not hit GitHub directly by default. Ask the user for the proxy details or reuse the team's documented proxy settings first.
- If a direct `git push` fails and the workspace rule says git must use a proxy, retry through the proxy before using any non-git fallback path.
- Treat `origin` as the default remote. Do not touch any other remote unless the user explicitly asks.

## Reference Discipline

- Before changing PRD, MVP, frontend IA, daemon/runtime flow, memory design, or agent rules, review:
  - `docs/research/Reference-Stack.md`
  - `docs/research/Slock-Local-Notes.md`
  - `docs/product/PRD.md`
  - `docs/product/Phase0-MVP.md`
- Treat `Slock` as shell reference, `Multica` as control-plane reference, `Lody` as execution-isolation reference, and local `slock` files as memory/rules reference.
