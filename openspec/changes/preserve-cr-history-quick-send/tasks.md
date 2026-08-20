## 1. 根因修复：CodeMirror 换行保留编辑器

- [x] 1.1 新增依赖 `@codemirror/state` / `@codemirror/view` / `@codemirror/commands`
- [x] 1.2 新增 `CrPreservingEditor` 组件：基于 CodeMirror 6，insert 保留原始换行字符，sliceDoc 输出 CRLF/CR
- [x] 1.3 非受控 + ref 外部设置：编辑 onChange 单向通知不反向 dispatch（光标稳定）；外部设置 `ref.setValue`，同内容不重复（无循环）
- [x] 1.4 实验验证修正：setValue 跨风格先 reconfigure 再 insert（避免双 CR）；同 dispatch changes+reconfigure 产生双 CR；reconfigure 保留光标；不重建 view
- [x] 1.5 SendPanel 发送框 / QuickSendPanel 内容框改用 CrPreservingEditor；快捷键 CodeMirror keymap（ref 转发 handler + 排 defaultKeymap 前）
- [x] 1.6 doSend / handleQuickSend 的 lfToCr 先归一化再转换，避免双 CR

## 2. 单元测试

- [x] 2.1 CodeMirror lineSeparator 编辑后保留 CRLF/CR/LF
- [x] 2.2 keymap 优先级：Mod+Enter 触发自定义 handler 不被默认覆盖
- [x] 2.3 ref.setValue：同内容不重复触发（无循环）、不同内容触发一次
- [x] 2.4 setValue 外部设置 / 历史切换 / 清空 CRLF 保留
- [x] 2.5 lineEnding 工具与 lfToCr 转换

## 3. 验证

- [x] 3.1 运行全部测试通过（30/31，仅预先存在的 TCP 时序测试失败）
- [x] 3.2 构建通过

## 4. 已知边界

- jsdom 无法测量 CodeMirror 文本（measureTextSize 报错），真实粘贴/打字/光标交互需在 Electron 环境验证
- 粘贴保留 CRLF 依赖 CodeMirror insert 字面字符；用户新输入 Enter 的换行风格由 lineSeparator 决定
