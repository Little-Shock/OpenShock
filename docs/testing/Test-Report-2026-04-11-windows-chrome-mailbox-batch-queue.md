# 2026-04-11 Mailbox Batch Queue Report

- Ticket: `TKT-91`
- Checklist: `CHK-21`
- Test Case: `TC-080`
- Scope: mailbox multi-select batch queue, sequential bulk ack/comment/complete, open queue clear-down
- Command: `OPENSHOCK_WINDOWS_CHROME=1 pnpm test:headed-mailbox-batch-actions -- --report docs/testing/Test-Report-2026-04-11-windows-chrome-mailbox-batch-queue.md`
- Artifacts Dir: `/tmp/openshock-tkt91-mailbox-batch-p7r3Gs`

## Results

- `/mailbox` 现在支持多选 open handoff 并进入同一条 `Batch Queue`；`Select Open` 后可以一次性锁定多条当前 formal handoff，而不必逐卡重复点击 -> PASS
- `Batch Acknowledge` 会按既有 `/v1/mailbox/:id` 顺序提交到每条 selected handoff；两条 reviewer lane 都会切到 `acknowledged`，证明这不是前端假批量态 -> PASS
- `Batch Formal Comment` 会把统一 note 顺序写回每条 selected handoff，且 lifecycle 继续保持 `acknowledged`，不会因为批量 comment 把状态冲坏 -> PASS
- `Batch Complete` 后，两条 handoff 都会落到 `completed`，open queue 归零、selection 自动清空、closeout note 同步进入 inbox summary，说明 bulk closeout 已进入正式产品面 -> PASS

## Screenshots

- mailbox-batch-requested: /tmp/openshock-tkt91-mailbox-batch-p7r3Gs/screenshots/01-mailbox-batch-requested.png
- mailbox-batch-selected: /tmp/openshock-tkt91-mailbox-batch-p7r3Gs/screenshots/02-mailbox-batch-selected.png
- mailbox-batch-acknowledged: /tmp/openshock-tkt91-mailbox-batch-p7r3Gs/screenshots/03-mailbox-batch-acknowledged.png
- mailbox-batch-comment: /tmp/openshock-tkt91-mailbox-batch-p7r3Gs/screenshots/04-mailbox-batch-comment.png
- mailbox-batch-completed: /tmp/openshock-tkt91-mailbox-batch-p7r3Gs/screenshots/05-mailbox-batch-completed.png
