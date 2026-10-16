---
name: web-pro-review
description: Use when the user asks Codex to review a repository or diff with ChatGPT Web Pro, validate findings, or re-review fixes in the same web conversation. Not for ordinary local code review without a webpage request.
---

# 网页 Pro 代码审查

按 ../../docs/browser-workflow.md 执行 kind=review。确认实际 Pro 可用、准备带行号/哈希的 diff 和相关源码、单次提交、核对发现与本地测试。用户授权修复时完成本地修复再同会话复审。不要把 High/Thinking 当 Pro。

MCP 工具以本地 codex-web-capabilities 服务器实际提供的名称调用。若未加载 MCP，可使用同包 CLI JSON 文件输入，见 README；不要假称后台正在调用原生浏览器。

任务期间持续向用户报告可验证进展。区分实现、离线测试、实机成功；遇到账户前置条件保留明确恢复点。
