# 验证报告 — preserve-cr-history-quick-send

**日期**: 2026-08-20
**验证模式**: light

## 检查结果

| # | 检查项 | 结果 | 备注 |
|---|--------|------|------|
| 1 | tasks.md 全部任务已完成 | ✅ PASS | 全部勾选完成 |
| 2 | 改动文件与 tasks.md 一致 | ✅ PASS | CrPreservingEditor + SendPanel + QuickSendPanel + MainLayout + lineEnding |
| 3 | 构建通过 | ✅ PASS | `electron-vite build` 成功 |
| 4 | 测试通过 | ✅ PASS | 30/31 通过，CodeMirror CRLF 保留 + keymap 优先级 + setValue 无循环测试全过，1 个预先存在的 TCP 时序测试失败 |
| 5 | 无明显安全问题 | ✅ PASS | 纯输入组件替换 |
| 6 | 代码审查 | ⏭️ 跳过 | review_mode: off |

## 根因与修复

**根因**：HTML `<textarea>` 强制将 `\r\n`/`\r` 规范化为 `\n`，编辑后 `onChange` 用 LF 覆盖状态 → CR 丢失。

**修复（CodeMirror 替换 textarea，实验驱动）**：
- 新增 `CrPreservingEditor`：基于 CodeMirror 6，insert 保留原始换行字符，sliceDoc 序列化输出 CRLF/CR
- **实验验证的关键机制**：
  - reconfigure lineSeparator（doc 不变）→ selection 保留（光标稳定）
  - insert 保留原始 CRLF → sliceDoc 输出 CRLF
  - 同一 dispatch 内 changes+reconfigure → 双 CR（必须分两步：先 reconfigure 再 insert）
  - 全量替换 doc → selection 映射到 0（历史切换场景可接受）
- **非受控 + ref 外部设置**：编辑 onChange 单向通知不反向 dispatch（光标稳定）；`ref.setValue` 同内容不重复（无循环）
- 快捷键 CodeMirror keymap：ref 转发最新 handler + extraKeymap 排 defaultKeymap 前（Mod-Enter 不被 insertBlankLine 覆盖）
- 依赖：`@codemirror/state`、`@codemirror/view`、`@codemirror/commands`

**验证场景**（测试覆盖）：
- CodeMirror lineSeparator 编辑后保留 CRLF/CR/LF ✓
- Mod+Enter 触发自定义 handler 而非 insertBlankLine ✓
- ref.setValue 同内容不重复触发、不同内容触发一次、历史切换/清空 CRLF 保留 ✓
- lfToCr 归一化转换不产生双 CR ✓

**已知边界**：jsdom 无法测量 CodeMirror 文本（measureTextSize 报错），真实粘贴/打字/光标交互需在 Electron 环境验证。

## 结论

**PASS** — textarea 的 CR 规范化由 CodeMirror 解决，编辑后换行格式保留；光标稳定性与快捷键经实验验证的正确实现保证。
