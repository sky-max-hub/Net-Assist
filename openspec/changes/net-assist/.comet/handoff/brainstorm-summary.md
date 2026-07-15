# Brainstorm Summary

- Change: net-assist
- Date: 2026-07-15

## 确认的技术方案

- **布局**: 方案 B — 左侧 Sidebar (240px) 含 Tab 列表 + 快捷发送，右侧 Content Area 含连接配置 + 收发面板
- **消息管理**: 上限裁剪，每个 Tab 最多 5000 条消息，超出自动丢弃最早消息
- **TCP Server 交互**: 广播模式 — 发送时可选择"广播所有客户端"或"指定客户端"
- **消息显示**: 完整信息 — 时间戳(ms) + 方向(→/←) + 来源/目标(IP:Port) + 字节数(B) + 内容
- **发送行为**: 原样透传，不追加任何换行符
- **字符可见性**: 输入区空格/Tab/CR/LF 等不可见字符用可视化符号显示（·→⏎¶）
- **编码**: ASCII/UTF-8 用 Node.js 原生，GBK 用 iconv-lite（纯 JS 无编译依赖）
- **HEX 编辑器**: 16 列网格 + ASCII 对照行，非法字符红色高亮，发送前校验
- **架构**: Electron Main Process 处理所有网络 I/O，Renderer 通过 IPC 通信，Zustand 管理状态

## 关键取舍与风险

- iconv-lite vs iconv: 选 iconv-lite 避免 node-gyp 编译问题，代价是 GBK 编码性能略低于原生
- 消息上限 5000: 足够调试使用，不会内存溢出
- 不做虚拟滚动: 5000 条上限下常规 DOM 可承受，省去虚拟滚动的复杂度

## 测试策略

- Main Process 网络层: Vitest + mock net/dgram 单元测试
- IPC: 集成测试 Electron 测试工具
- UI 组件: Vitest + @testing-library/react
- 端到端: 手动测试真实 TCP 交互、多 Tab 并发

## Spec Patch

- `quick-send/spec.md`: 移除换行符配置 scenario，新增字符可见性 requirement
