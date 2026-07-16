## Fix

- defaultSendOptions encoding: 'gbk'
- MessageItem: 每条消息包裹边框容器，hover 显示复制按钮
- 复制使用 `navigator.clipboard.writeText(message.text)` 复制原文
- antd Tooltip 或自定义提示"已复制"，1s 后消失
