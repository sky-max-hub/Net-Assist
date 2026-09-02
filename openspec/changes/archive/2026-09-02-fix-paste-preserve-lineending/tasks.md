# Tasks

## 1. 修复粘贴 handler 的 lineSeparator reconfigure 逻辑

- [x] `CrPreservingEditor.tsx` 粘贴 handler：仅当选区覆盖整个文档（`main.from === 0 && main.to === doc.length`）时按粘贴文本风格 reconfigure lineSeparator；片段粘贴保持当前 lineSeparator，避免尾部 CR LF 变 LF

## 2. 验证与测试

- [x] 用 `@codemirror/state` 实证：CRLF 文档替换中间片段后 sliceDoc 尾部保留 `\r\n`；reconfigure 到 LF 才翻转
- [x] 运行相关测试与构建确认通过（相关测试 26/26，`npm run build` exit 0）
