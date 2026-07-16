## Why

快速切换 tab 时，TcpClientConfig/TcpServerConfig 的 useState 初始值不随 tab prop 变化更新，导致显示其他连接的 host/port。

## What Changes

给 TabContent 中渲染的 config panel 加 `key={tab.id}`，强制切换 tab 时重新挂载组件。

## Impact

`TabContent.tsx`
