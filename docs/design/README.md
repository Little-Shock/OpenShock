# Design Notes

OpenShock 当前前端不是直接导入 Stitch 代码生成物，而是参考 Stitch 上已经探索出来的页面信息架构、视觉方向和品牌气质来手写实现。

## Current Inputs

- Root [DESIGN.md](../../DESIGN.md)
- Stitch 项目中的页面结构和视觉探索
- Slock 风格的聊天优先、轻松但高信号的协作气质

## Current Output In Code

可以在这些文件看到当前落地结果：

- [globals.css](../../apps/web/src/app/globals.css)
- [open-shock-shell.tsx](../../apps/web/src/components/open-shock-shell.tsx)
- [phase-zero-views.tsx](../../apps/web/src/components/phase-zero-views.tsx)

## Important Clarification

- 现在是“参考 Stitch 设计方向”
- 还不是“完全按 Stitch 最终稿逐屏逐组件还原”
- 更不是“直接复用 Stitch 导出的生产代码”

下一步如果要更严格对齐 Stitch，需要把你现在 Stitch 里的主路由和最终版视觉选型收成一份固定规范，再逐页回填到前端实现。
