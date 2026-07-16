## 1. 持久化发送选项

- [ ] 1.1 shared/types.ts 新增 SendOptions 接口 + TabState.sendOptions
- [ ] 1.2 renderer tab-store 新增 updateSendOptions + defaultSendOptions
- [ ] 1.3 持久化包含 sendOptions（PersistedTab 自动跟随 TabState）
- [ ] 1.4 SendPanel 改用 store 读写 encoding/displayMode/lfToCr
- [ ] 1.5 TypeScript 编译 + 构建通过
