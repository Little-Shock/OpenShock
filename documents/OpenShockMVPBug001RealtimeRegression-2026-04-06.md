# BUG-MVP-001 长会话回归补充报告

- 日期：2026-04-06
- 目标：补齐 `delivery webhook -> Room 实时刷新` 的长会话手工回归证据
- 关联 bug：`BUG-MVP-001`
- 关联基线：
  - `documents/OpenShockTrueP0WalkthroughReport-2026-04-06-fixed.md`
  - `documents/OpenShockMVPBugList.md`

## 1. 测试目标

验证在同一条 long-running backend/frontend 会话中：

1. Room 页面保持打开且不手工刷新
2. Delivery webhook 回写 `merged`
3. Room 页面能够自动看到状态同步更新
4. 重进页面后状态保持一致

## 2. 测试环境

- backend：`http://127.0.0.1:18081`
- frontend：`http://127.0.0.1:13001`
- daemon：多次执行 `go run ./cmd/daemon --once --api-base-url http://127.0.0.1:18081 ...`
- 浏览器：Playwright 持续保持 Room 页面打开
- 临时仓库：`/tmp/openshock-bug001-repo`

说明：

- 为避免共享环境和历史 in-memory 状态干扰，本次单独启动隔离服务。
- 但页面全程使用同一条 frontend 会话，不做手工刷新。

## 3. 测试样本

本次使用一条最小真实链路生成可 webhook 的 Delivery PR：

1. 新建 `issue_104`
2. 绑定本地 repo `/tmp/openshock-bug001-repo`
3. 创建 `task_101`
4. 创建并完成 `run_101`
5. 将 task 标记为 `ready_for_integration`
6. 批准并完成 `merge_101`
7. 创建 `pr_102`

创建 Delivery PR 后的基线状态：

- `issue_104.status = in_review`
- `deliveryPr.id = pr_102`
- `deliveryPr.externalPrId = gh_pr_102`
- `deliveryPr.status = open`
- `integrationBranch.status = ready_for_delivery`

## 4. 长会话观察步骤

1. 浏览器打开 `http://127.0.0.1:13001/rooms/issue_104`
2. 确认页面初始显示：
   - Delivery 主状态为 `open`
   - 页面中已有 `QA created Delivery PR pr_102 ...` 系统消息
3. 保持页面不刷新
4. 通过 webhook 接口发送：

```json
{
  "eventId": "evt_bug_mvp_001_2",
  "provider": "github",
  "externalPrId": "gh_pr_102",
  "status": "merged"
}
```

5. 等待前端 SSE 驱动的自动刷新
6. 观察当前页面变化
7. 再次直接进入 `/rooms/issue_104`，确认重进后的状态一致

## 5. 实际结果

### 5.1 webhook 回写结果

接口返回：

```json
{
  "deliveryPrId": "pr_102",
  "status": "merged",
  "replayed": false
}
```

后端状态变为：

- `issue_104.status = done`
- `deliveryPr.status = merged`
- `integrationBranch.status = merged_to_main`

### 5.2 Room 长会话页面结果

在不手工刷新页面的前提下，当前打开的 Room 页面出现了两类可见变化：

1. 新增系统消息：
   - `Delivery PR pr_102 merged via github webhook.`
2. Delivery 卡片主状态从 `open` 变为 `merged`

同时，从前端 dev server 日志可见 webhook 后页面再次请求了 `/rooms/issue_104`，说明前端已通过 realtime 触发 `router.refresh()`。

### 5.3 重进页面一致性

再次直接进入 `/rooms/issue_104` 后：

1. 页面仍显示 webhook merged 的系统消息
2. Delivery 主状态保持为 `merged`
3. 与后端 issue/detail 数据一致

## 6. 结论

`BUG-MVP-001` 通过。

本次已经补齐：

1. 同一条 long-running backend/frontend 会话中的手工观察证据
2. webhook merged 后 Room 页面无需手工刷新即可看到状态变化
3. 重进页面后的状态一致性证据

因此这条 bug 可以关闭。

## 7. 备注

页面中 `Delivery PR Open` 这行文案来自操作按钮的固定文案逻辑，表示“已存在 Delivery PR”，不是主状态字段；本次不按实时刷新失败处理。
