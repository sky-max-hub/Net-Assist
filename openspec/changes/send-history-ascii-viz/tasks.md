## 1. ASCII 控制字符可视化

- [x] 1.1 创建 `AsciiHighlighter.tsx` 工具组件/函数：将控制字符(0x00-0x1F+0x7F)映射为 `<ABBR>` 标签
- [x] 1.2 在 `MessageItem.tsx` 中集成 ASCII 可视化渲染（消息显示区域）
- [x] 1.3 添加 `.ascii-ctrl` CSS 样式（高亮颜色：CR/LF/TAB 绿色、ESC 橙色、DEL 红色、其余灰色）

## 2. 发送命令历史

- [x] 2.1 在 `SendPanel.tsx` 中添加 `history` 和 `historyIndex` 状态
- [x] 2.2 发送成功后保存到历史（unshift 到头部），重置 index
- [x] 2.3 处理方向键 ↑/↓：从历史中取回/前进文本，显示到输入框
- [x] 2.4 边界处理：无历史、最旧/最新位置约束
- [x] 2.5 修改前手动保存当前输入（首次按↑时保存草稿）
- [x] 2.6 修改输入框 rows 从 3 → 6

## 3. 输入框 ASCII 预览

- [x] 3.1 在 TextArea 下方增加一行 ASCII 控制字符提示（计数摘要，如"3 个控制字符: CR, LF, TAB"）

## 4. 验证与收尾

- [x] 4.1 TypeScript 编译 + 构建通过
- [ ] 4.2 手动验证：命令历史 ↑↓ 导航、高度 6 行、控制字符可视化
