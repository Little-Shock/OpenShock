# 2026-04-11 Mailbox Batch Policy Report

- Ticket: `TKT-94`
- Checklist: `CHK-21`
- Test Case: `TC-083`
- Scope: governed batch policy, bulk complete + auto-advance, governed create contract, selection clear-down
- Command: `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-mailbox-batch-policy -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-mailbox-batch-policy.md`
- Artifacts Dir: `/tmp/openshock-tkt94-mailbox-batch-policy-KI9vYk`

## Results

- `Create Governed Handoff` 现在对应同一条正式 create contract；seed 进来的 batch items 会保留 `kind=governed`，不再把 governed route 假装成 manual handoff -> PASS
- 当前 room ledger 里的纯 governed selection 会先显示 `watch`，等 handoff 进入可 complete 状态后切到 `ready`，说明 batch surface 已读到正式治理 policy，而不是写死一个额外按钮 -> PASS
- `Batch Complete + Auto-Advance` 会顺序完成所有 selected governed handoff，并在 closeout 后只物化一条新的 reviewer -> QA followup handoff，避免重复起单 -> PASS
- 两条源 handoff 都保留同一份 closeout note，selection 自动清空，routing policy 会把 followup handoff 标成新的 active suggestion，说明 bulk auto-advance 已进入正式产品面 -> PASS

## Assertions

- Source handoffs: handoff-1775882759187271081, handoff-1775882759215960035
- Followup handoff: handoff-1775882760377817067 (Claude Review Runner -> Memory Clerk)
- Suggested handoff: handoff-1775882760377817067

## Screenshots

- mailbox-batch-policy-requested: /tmp/openshock-tkt94-mailbox-batch-policy-KI9vYk/screenshots/01-mailbox-batch-policy-requested.png
- mailbox-batch-policy-selected: /tmp/openshock-tkt94-mailbox-batch-policy-KI9vYk/screenshots/02-mailbox-batch-policy-selected.png
- mailbox-batch-policy-ready: /tmp/openshock-tkt94-mailbox-batch-policy-KI9vYk/screenshots/03-mailbox-batch-policy-ready.png
- mailbox-batch-policy-followup: /tmp/openshock-tkt94-mailbox-batch-policy-KI9vYk/screenshots/04-mailbox-batch-policy-followup.png
