---
name: web-deep-research
description: Use when the user asks Codex to invoke the actual ChatGPT website Deep Research capability and retrieve its complete report and citations, including long-running research recovery.
---

# 网页深度研究

按 ../../docs/browser-workflow.md 执行 kind=research，尤其第 4 节。必须选择真实 Deep Research 工具，跟踪澄清/计划/运行状态，提取当前轮次报告。当前账户没有该工具或应用失败时如实报告；不得用 Pro 长回答或 API 替代。

MCP 工具以本地 codex-web-capabilities 服务器实际提供的名称调用。若未加载 MCP，可使用同包 CLI JSON 文件输入，见 README；不要假称后台正在调用原生浏览器。

任务期间持续向用户报告可验证进展。区分实现、离线测试、实机成功；遇到账户前置条件保留明确恢复点。
