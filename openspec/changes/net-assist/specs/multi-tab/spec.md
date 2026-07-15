## ADDED Requirements

### Requirement: 多 Tab 管理
系统 SHALL 支持多 Tab 同时运行，每个 Tab 独立管理一个 TCP Client、TCP Server 或 UDP 连接。

#### Scenario: 新建 Tab
- **WHEN** 用户点击"新建连接"按钮并选择连接类型（TCP Client / TCP Server / UDP）
- **THEN** 系统创建一个新 Tab，显示对应类型的配置界面

#### Scenario: Tab 切换
- **WHEN** 用户点击不同的 Tab 标签
- **THEN** 系统切换到该 Tab 的界面，显示其状态和消息记录

#### Scenario: 关闭 Tab
- **WHEN** 用户点击 Tab 的关闭按钮
- **THEN** 系统关闭该 Tab 并释放其网络资源（断开连接/停止监听/关闭绑定）

#### Scenario: 多 Tab 独立运行
- **WHEN** 用户同时运行 TCP Server Tab（监听 8888）、TCP Client Tab（连接 8888）和 UDP Tab
- **THEN** 三个 Tab 互不干扰，各自独立收发数据

#### Scenario: Tab 标题自定义
- **WHEN** 用户新建 Tab 时
- **THEN** 系统自动生成标题（如"TCP Client: host:port"），用户可双击修改
