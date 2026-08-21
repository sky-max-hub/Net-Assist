## Purpose

多 Tab 连接管理：每个标签独立管理一个 TCP Client、TCP Server 或 UDP 连接，连接列表按原型展示与交互（状态点/类型图标/搜索/折叠导轨/拖拽排序/重命名/悬停关闭）。

## ADDED Requirements

### Requirement: 多 Tab 管理
系统 SHALL 支持多 Tab 同时运行，每个 Tab 独立管理一个 TCP Client、TCP Server 或 UDP 连接。连接列表按原型展示：状态点、类型胶囊（TC/TS/UD）、标题；支持搜索过滤、折叠为图标导轨、拖拽排序、双击重命名、悬停关闭。

#### Scenario: 新建 Tab
- **WHEN** 用户点击"新建连接"按钮并选择连接类型（TCP Client / TCP Server / UDP）
- **THEN** 系统创建一个新 Tab，显示对应类型的配置界面

#### Scenario: Tab 切换
- **WHEN** 用户点击不同的 Tab 标签
- **THEN** 系统切换到该 Tab 的界面，显示其状态和消息记录

#### Scenario: 关闭 Tab
- **WHEN** 用户点击 Tab 的关闭按钮（悬停显示）
- **THEN** 系统关闭该 Tab 并释放其网络资源（断开连接/停止监听/关闭绑定）

#### Scenario: 多 Tab 独立运行
- **WHEN** 用户同时运行 TCP Server Tab（监听 8888）、TCP Client Tab（连接 8888）和 UDP Tab
- **THEN** 三个 Tab 互不干扰，各自独立收发数据

#### Scenario: Tab 标题自定义
- **WHEN** 用户双击 Tab 标题
- **THEN** 系统允许编辑标题，回车或失焦后保存

#### Scenario: 拖拽排序
- **WHEN** 用户拖拽 Tab 到新位置
- **THEN** 连接顺序更新并持久化，重启后保留

#### Scenario: 搜索过滤连接
- **WHEN** 用户在侧栏搜索框输入关键词
- **THEN** 连接列表仅显示标题或类型匹配的连接

#### Scenario: 折叠为图标导轨
- **WHEN** 用户点击折叠按钮
- **THEN** 侧栏收窄为图标导轨，悬停图标显示连接名称、状态与远端提示
