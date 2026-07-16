## Fix

在 `TabState` 中新增 `sendOptions` 字段，PersistedTab 同步持久化。SendPanel 用 `useTabStore` 读写替代本地 `useState`。
