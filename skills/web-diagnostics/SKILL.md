---
name: web-diagnostics
description: Use for Codex Web Capabilities installation, account/model discovery, browser connectivity, task recovery, runtime diagnostics/rollback, or web voice availability questions.
---

# 网页能力诊断配置

先调用 capabilities/list/status；读 ../../docs/browser-workflow.md 和 ../../docs/runtime.md。分别报告插件接口、原生浏览器连接、账户可见模型/工具、运行时健康、Developer Mode/tunnel 权限与实机验收状态。缺失权限不等于插件故障。voice 返回 not_implemented，不开麦克风，不用 TTS 替代。

MCP 工具以本地 codex-web-capabilities 服务器实际提供的名称调用。若未加载 MCP，可使用同包 CLI JSON 文件输入，见 README；不要假称后台正在调用原生浏览器。

任务期间持续向用户报告可验证进展。区分实现、离线测试、实机成功；遇到账户前置条件保留明确恢复点。
