---
name: web-image
description: Use when the user asks Codex to create or edit images through ChatGPT website, upload reference images, continue image iterations, or download complete batches of originals. Not for API image generation.
---

# 网页创建与编辑图像

按 ../../docs/browser-workflow.md 执行 kind=image，尤其第 5 节。保存参考图关系，绑定当前轮次，使用原生浏览器原图下载并 import_image。数量不足或缩略图不能成功；在 Codex 预览交付原图。

MCP 工具以本地 codex-web-capabilities 服务器实际提供的名称调用。若未加载 MCP，可使用同包 CLI JSON 文件输入，见 README；不要假称后台正在调用原生浏览器。

任务期间持续向用户报告可验证进展。区分实现、离线测试、实机成功；遇到账户前置条件保留明确恢复点。
