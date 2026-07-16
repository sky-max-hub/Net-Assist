React 在相同位置的同类型组件会复用实例，useState 只在首次渲染时使用初始值。加 `key={tab.id}` 强制 unmount→remount。
