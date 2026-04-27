# TKT-04 GitHub App Onboarding Report

Date: 2026-04-23T15:40:36.886Z
Project Root: /home/lark/OpenShock
Workspace Root: /tmp/openshock-tkt04-github-onboarding-VosvL1/workspace
Artifacts Root: /tmp/openshock-tkt04-github-onboarding-VosvL1
Chromium: /snap/bin/chromium

## Environment

- Web: http://127.0.0.1:43832
- Server: http://127.0.0.1:43420
- Daemon: http://127.0.0.1:43470
- App Install URL: https://github.com/apps/openshock-app/installations/new

## GitHub Setup Checks

- GitHub Readiness Status: 未完成
- GitHub Message: GitHub 应用已配置，但还没完成安装；当前先使用命令行登录。
- GitHub Missing Fields: 缺少信息：installationId
- GitHub Install Link: https://github.com/apps/openshock-app/installations/new
- GitHub Return Steps: 完成安装后会自动返回并刷新当前状态。如未自动更新，再手动重新检查。
- Repo Bind Button: 同步仓库绑定
- Repo Binding Status: 待补安装
- Repo Binding Message: GitHub 应用已配置，但还没完成安装；当前先使用命令行登录。
- Repo Binding Error: GitHub 应用已配置，但还没完成安装；当前先使用命令行登录。
- Repo Binding Missing Fields: 缺少信息：installationId
- Repo Binding Install Link: https://github.com/apps/openshock-app/installations/new
- Repo Binding Return Steps: 安装完成后会自动返回并更新仓库状态。如未自动更新，再手动同步。

## Evidence

- setup-shell: /tmp/openshock-tkt04-github-onboarding-VosvL1/screenshots/01-setup-shell.png
- github-app-onboarding: /tmp/openshock-tkt04-github-onboarding-VosvL1/screenshots/02-github-app-onboarding.png
- repo-binding-blocked: /tmp/openshock-tkt04-github-onboarding-VosvL1/screenshots/03-repo-binding-blocked.png
- trace: /tmp/openshock-tkt04-github-onboarding-VosvL1/trace.zip
- daemon log: /tmp/openshock-tkt04-github-onboarding-VosvL1/logs/daemon.log
- server log: /tmp/openshock-tkt04-github-onboarding-VosvL1/logs/server.log
- web log: /tmp/openshock-tkt04-github-onboarding-VosvL1/logs/web.log

## Result

- TC-022 GitHub App effective auth setup surface: PASS
- TC-026 Headed Setup onboarding blocked path: PASS
- TKT-04 repo binding blocked contract when installation is pending: PASS
