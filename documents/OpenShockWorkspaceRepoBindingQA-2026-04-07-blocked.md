# Workspace 级 Repo 绑定 QA 阻塞记录

- 日期：2026-04-07
- 关联任务：
  - `#14` Workspace 级 Repo 绑定设计
  - `#15` Workspace 级 Repo 绑定实现
  - `#16` Workspace 级 Repo 绑定 QA 回归

## 1. 结论

`#16` 当前不能进入正式回归，阻塞原因已经由真实接口验证确认：

1. 旧入口 `Issue.bind_repo` 仍然可成功调用
2. 且该旧入口会直接创建 workspace default repo binding
3. 这与当前冻结设计冲突

按 `documents/OpenShockTrueP0TechnicalDesign.md` 当前冻结语义，这一轮 MVP 应满足：

1. `Workspace.bind_repo` 是唯一有效绑定入口
2. 旧 `Issue.bind_repo` 入口必须被明确拒绝
3. QA 不再验证兼容翻译，而是验证模型是否已经被真正切正

因此当前 `#15` 仍未达到 `#16` 的验收前提。

## 2. 真实验证环境

- backend：本地真实启动 `go run ./cmd/server`
- 地址：`http://127.0.0.1:8080`
- 验证方式：直接调用 `/api/v1/actions`

说明：

- 这里不是只看代码搜索结果，而是实际起服务后验证旧入口行为。
- 本次验证目标不是完整页面走查，而是先确认 `#16` 是否已具备统一验收前提。

## 3. 验证步骤与结果

### 3.1 初始 bootstrap

请求：

- `GET /api/v1/bootstrap`

关键结果：

- `workspace.repoBindings = []`
- 当前没有 default repo binding

### 3.2 调用旧入口 `Issue.bind_repo`

请求体：

```json
{
  "actorType": "human",
  "actorId": "qa",
  "targetType": "issue",
  "targetId": "issue_101",
  "actionType": "Issue.bind_repo",
  "idempotencyKey": "qa-workspace-bind-old-entry-1",
  "payload": {
    "repoPath": "/tmp/qa-old-entry-repo"
  }
}
```

实际响应：

```json
{
  "actionId": "action_101",
  "status": "completed",
  "resultCode": "workspace_repo_bound",
  "resultMessage": "Workspace default repo binding updated via issue compatibility path.",
  "affectedEntities": [
    {"type": "workspace", "id": "ws_01"},
    {"type": "workspace_repo_binding", "id": "wsrepo_101"},
    {"type": "issue", "id": "issue_101"}
  ]
}
```

结果判定：失败

原因：

1. 旧入口没有被拒绝
2. 还明确以“compatibility path”成功更新了 workspace default repo

### 3.3 再次读取 bootstrap

请求：

- `GET /api/v1/bootstrap`

关键结果：

- `workspace.repoBindings` 已出现一条 binding
- `workspace.defaultRepoBindingId = "wsrepo_101"`
- `repoPath = "/tmp/qa-old-entry-repo"`

结果判定：失败

原因：

- 这证明旧 `Issue.bind_repo` 入口不只是“还存在”，而且仍然是有效写入口。

## 4. 与冻结设计的冲突点

当前实现行为与冻结设计的冲突是明确的：

1. 设计要求：`Issue.bind_repo` 直接退出正式能力面
2. 设计要求：若还有旧路径调用，应直接返回明确错误，提示改用 workspace 级入口
3. 实际行为：旧入口成功写入 workspace default repo binding

因此 `#16` 当前不能按“workspace 模型已切正”给通过结论。

## 5. 对 `#16` 的处理建议

建议先不做完整回归报告，先等待 `#15` 去掉旧入口兼容逻辑后再继续。

下一步恢复 `#16` 的前提应为：

1. `Issue.bind_repo` 直接返回明确错误
2. `Workspace.bind_repo` 成为唯一有效绑定入口
3. 再继续验证：
   - 绑定入口是否只剩 workspace 真相
   - run / merge / delivery 是否只从 workspace repo 解析
   - 旧 issue 级入口是否已被明确拒绝
