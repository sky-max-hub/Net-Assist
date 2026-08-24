# 验证报告：fix-paste-cr-crlf

- 日期：2026-08-24
- Change：`fix-paste-cr-crlf`（hotfix）
- 分支：`feature-v2.00.00`
- 验证模式：light（规模评估自动判定 full，但按覆盖机制手动调整为 light——预设 hotfix、无 delta spec、实际实现改动仅 3 个文件：`controlChars.ts`、`CrPreservingEditor.css`、`controlChars.test.ts`，其余为 openspec 元数据）

## 修复内容

1. **粘贴 CR 显示为 CR LF**：`controlChars.ts` 用 `separatorKind()` 区分 CR-only / CRLF / LF，`LineBreakWidget` 按 kind 渲染 `<CR>` / `<CR><LF>` / `<LF>`。
2. **初始内容不显示 ASCII 标记**：`controlCharField.create()` 基于初始 doc 计算装饰（`buildDecorations`），`update` 在 doc 或 lineSeparator 变化时重建。
3. **快捷指令编辑框行数多时不滚动**：`.cr-editor` 改为确定高度 180px（与发送框 `.cmp-input` 一致），使 `.cm-scroller` 有界可滚动。

## 轻量验证 6 项检查

| # | 检查项 | 结果 | 证据 |
|---|--------|------|------|
| 1 | tasks.md 全部任务完成 | PASS | 8/8 已勾选 |
| 2 | 改动文件与 tasks 描述一致 | PASS | `git diff HEAD~2...HEAD`：controlChars.ts、CrPreservingEditor.css、controlChars.test.ts |
| 3 | 编译通过 | PASS | `npm run build` exit 0（electron-vite，100 modules） |
| 4 | 相关测试通过 | PASS | `controlChars.test.ts` 11、`paste-flow.test.tsx` 4、`sendpanel-render.test.tsx` 1 全部通过 |
| 5 | 无明显安全问题 | PASS | 无硬编码密钥、无新增 unsafe 操作 |
| 6 | 代码审查 | SKIP | `review_mode: off`（hotfix 预设跳过自动审查），用户已手动验证行为 |

## 记录的既有问题（不在本次范围内）

- **`src/main/connections/__tests__/tcp-client-connection.test.ts` → "sends data and calls onData for tx echo" 失败**：自 commit `19afd7eb`（2026-07-15 "remove duplicate message emission in TCP send path"）起，`send()` 有意移除内部 onData 回显后，该测试期望未同步更新，一直失败。属主进程 TCP 子系统，与本次渲染层改动完全无关。用户确认「记录即可」，不在此 hotfix 修复。

## 分支处理

- 用户选择：**保持分支**（feature-v2.00.00 保留，不合并、不推送、不删除）。
- `branch_status: handled`。

## 结论

本次 hotfix 三项修复验证通过（相关测试全绿、构建通过、用户手动确认行为），可进入归档。
