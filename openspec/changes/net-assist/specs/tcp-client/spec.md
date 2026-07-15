## ADDED Requirements

### Requirement: TCP 客户端连接
系统 SHALL 支持以 TCP 客户端模式连接远程服务器，发送数据并接收响应。

#### Scenario: 成功连接
- **WHEN** 用户在 TCP Client Tab 中输入目标 IP 和端口，点击"连接"
- **THEN** 系统建立 TCP 连接，状态显示"已连接"

#### Scenario: 连接失败
- **WHEN** 用户尝试连接不可达的目标地址
- **THEN** 系统显示连接失败的错误信息

#### Scenario: 发送文本数据
- **WHEN** 用户在已连接的 TCP Client Tab 中输入文本并点击"发送"
- **THEN** 系统将文本按当前编码转换后发送，并在消息列表中显示已发送的内容和时间

#### Scenario: 接收数据
- **WHEN** TCP 连接的远端发送数据
- **THEN** 系统在消息列表中显示接收到的数据、时间和来源

#### Scenario: 断开连接
- **WHEN** 用户在已连接状态下点击"断开"
- **THEN** 系统关闭 TCP 连接，状态显示"未连接"

### Requirement: 文本编码切换
系统 SHALL 支持在文本模式下切换 ASCII、UTF-8、GBK 编码进行收发。

#### Scenario: 编码切换后发送
- **WHEN** 用户选择 GBK 编码并发送中文文本
- **THEN** 系统以 GBK 编码转换文本为字节后发送

#### Scenario: 编码切换后接收
- **WHEN** 用户选择 UTF-8 编码并接收到数据
- **THEN** 系统以 UTF-8 编码将接收到的字节解码为文本显示
