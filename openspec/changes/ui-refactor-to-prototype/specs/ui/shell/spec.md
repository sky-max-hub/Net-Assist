## Purpose

顶部应用标题栏承载全局状态指示与设置入口，配合底部 toast 提供轻量操作反馈，构成整体应用外壳；保留原生窗口边框。

## ADDED Requirements

### Requirement: 顶部标题栏
内容区顶部 SHALL 显示应用标题（NetAssist · 网络调试助手）、全局状态指示与设置入口；保留原生窗口边框，不绘制红绿灯按钮。

#### Scenario: 全局状态显示
- **WHEN** 存在活跃连接时
- **THEN** 全局状态显示"N 个连接活跃"（绿点）

#### Scenario: 全局异常状态
- **WHEN** 存在异常连接时
- **THEN** 全局状态显示"N 个连接异常"（红点），优先于活跃状态

#### Scenario: 全局空闲状态
- **WHEN** 无任何活跃或异常连接时
- **THEN** 全局状态显示"空闲"（灰点）

### Requirement: Toast 提示
系统 SHALL 以底部居中 Toast 提示操作结果，短暂显示后自动消失。

#### Scenario: 操作提示
- **WHEN** 用户执行新建连接、发送、保存等操作
- **THEN** 底部居中显示对应 Toast 提示，约 1.8 秒后自动消失
