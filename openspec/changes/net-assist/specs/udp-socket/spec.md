## ADDED Requirements

### Requirement: UDP 数据收发
系统 SHALL 支持以 UDP 模式发送和接收数据包。

#### Scenario: 绑定本地端口
- **WHEN** 用户在 UDP Tab 中输入本地端口并点击"绑定"
- **THEN** 系统绑定指定端口，状态显示"已绑定"

#### Scenario: 发送 UDP 数据
- **WHEN** 用户在 UDP Tab 中输入目标 IP、端口和数据，点击"发送"
- **THEN** 系统向目标地址发送 UDP 数据包，消息列表中记录已发送内容

#### Scenario: 接收 UDP 数据
- **WHEN** 系统在绑定的 UDP 端口上接收到数据包
- **THEN** 系统在消息列表中显示接收到的数据和来源 IP 端口

#### Scenario: 关闭绑定
- **WHEN** 用户点击"关闭"按钮
- **THEN** 系统关闭 UDP 绑定，状态显示"未绑定"
