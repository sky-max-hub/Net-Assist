# ui/welcome Specification

## Purpose
无连接时的欢迎引导页：让用户一眼了解三种通信模式（TCP Client / TCP Server / UDP），并通过模式卡片快速新建连接，同时展示常用快捷键提示。
## Requirements
### Requirement: 欢迎页展示
系统 SHALL 在无任何连接标签时显示欢迎页，包含应用名称、简介、三种模式卡片与快捷键提示。

#### Scenario: 无标签显示欢迎页
- **WHEN** 应用启动且无任何连接标签
- **THEN** 显示欢迎页，包含 TCP Client / TCP Server / UDP 三张模式卡片与快捷键提示

#### Scenario: 新建连接后退出欢迎页
- **WHEN** 用户通过欢迎页卡片新建连接
- **THEN** 欢迎页隐藏，进入对应连接的工作区

### Requirement: 模式卡片新建
欢迎页 SHALL 提供三种模式卡片，点击任一张卡片即新建对应类型的连接并进入工作区。

#### Scenario: 点击卡片新建
- **WHEN** 用户点击"TCP Client"卡片
- **THEN** 系统创建新的 TCP Client 标签并进入其工作区

#### Scenario: 键盘新建
- **WHEN** 用户用 Tab 聚焦模式卡片并按 Enter 或空格
- **THEN** 系统创建对应类型的连接并进入工作区

