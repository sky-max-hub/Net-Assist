## ADDED Requirements

### Requirement: HEX 模式显示
系统 SHALL 支持以十六进制格式显示收发数据。

#### Scenario: 切换到 HEX 显示
- **WHEN** 用户在收发面板中选择 HEX 显示模式
- **THEN** 接收到的数据显示为十六进制格式（如 `AA BB CC`）

#### Scenario: HEX 模式发送
- **WHEN** 用户在 HEX 模式下输入十六进制字符串（如 `AA BB CC`）并发送
- **THEN** 系统将十六进制转换为原始字节发送

#### Scenario: HEX 输入校验
- **WHEN** 用户在 HEX 模式下输入非法十六进制字符
- **THEN** 系统提示输入格式错误

#### Scenario: 文本模式与 HEX 模式切换
- **WHEN** 用户在文本模式和 HEX 模式之间切换
- **THEN** 已存在的消息按当前模式重新渲染，新消息按当前模式显示
