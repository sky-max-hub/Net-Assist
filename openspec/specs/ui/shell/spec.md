# ui/shell Specification

## Purpose
应用外壳：设置入口位于侧栏底部（sb-foot，与版本号并排），配合底部 toast 提供轻量操作反馈；不渲染顶部标题栏与全局状态指示，保留原生窗口边框。
## Requirements
### Requirement: 设置入口
系统 SHALL 在侧栏底部（sb-foot）显示版本号与设置按钮，点击设置按钮打开设置弹窗。

#### Scenario: 打开设置弹窗
- **WHEN** 用户点击侧栏底部的设置按钮
- **THEN** 弹出设置弹窗，默认选中"通用"分类

#### Scenario: 无标题栏与全局状态
- **WHEN** 应用加载时
- **THEN** 不显示顶部标题栏与全局状态指示（空闲/活跃/异常），设置入口位于侧栏底部

### Requirement: Toast 提示
系统 SHALL 以底部居中 Toast 提示操作结果，短暂显示后自动消失。

#### Scenario: 操作提示
- **WHEN** 用户执行新建连接、发送、保存等操作
- **THEN** 底部居中显示对应 Toast 提示，约 1.8 秒后自动消失

