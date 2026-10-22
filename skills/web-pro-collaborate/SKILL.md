---
name: web-pro-collaborate
description: Use when the user wants ongoing architecture or coding consultation with ChatGPT Web GPT-6 or an explicitly requested Pro model while Codex remains the local executor, including context additions and test-failure feedback.
---

# 网页 GPT-6 持续协作

按 ../../docs/browser-workflow.md 执行 kind=collaborate、mode=chat，默认实际可见的 GPT-6；记录独立 effort，不能因缺少 Pro 阻止普通协作。保留同一仓库与会话，每轮通过 parent 续接并附新上下文/测试失败。网页提供推理，Codex 根据已授权范围落实和验证；需要网页直接驱动原生工具时转 web-agent。

MCP 工具以本地 codex-web-capabilities 服务器实际提供的名称调用。若未加载 MCP，可使用同包 CLI JSON 文件输入，见 README；不要假称后台正在调用原生浏览器。

任务期间持续向用户报告可验证进展。区分实现、离线测试、实机成功；遇到账户前置条件保留明确恢复点。
