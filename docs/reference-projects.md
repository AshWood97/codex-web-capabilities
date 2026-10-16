# 参考项目与采用记录

核查日期：2026-10-16。采用依据为模块适配程度；stars/forks 不作为实现已验证的证据。以下“设计借鉴”均为本项目重新实现或技能流程适配，没有逐行移植源文件。完整编码依赖独立安装的锁定上游，实机是否通过见验收报告。

| 项目与固定快照 | 许可证 | 类型 | 采用模块 | 修改/整合方式 |
|---|---|---|---|---|
| [miuuyy/codex-chatgpt-web](https://github.com/miuuyy/codex-chatgpt-web/tree/f137c2f84da5df214c1e228d74f5ff43e7641c48) · `f137c2f84da5df214c1e228d74f5ff43e7641c48` | MIT | 运行时依赖 | Responses/SSE、task-bound MCP、原生工具循环、compaction、保留会话 | src/runtime.ts 固定快照安装；不改上游源码；native/审批/独立配置约束在 wrapper 中实现 |
| [pauljunsukhan/codex-chatgpt-pro-plugin](https://github.com/pauljunsukhan/codex-chatgpt-pro-plugin/tree/0cc5c5509ebaccfc7dad45b9e02a0f86407c817c) · `0cc5c5509ebaccfc7dad45b9e02a0f86407c817c` | MIT | 设计借鉴 | repo rooms、源码包、行号映射、哈希与 receipts | src/context.ts 与 src/jobs.ts 独立实现；不使用其 CDP 或全局浏览器锁 |
| [rebel0789/codexpro](https://github.com/rebel0789/codexpro/tree/113472c6ff0a1516b6f223a43cd355abdf2e61ae) · `113472c6ff0a1516b6f223a43cd355abdf2e61ae` | MIT | 设计借鉴 | 仓库导出、工作区路径边界、可选只读 MCP | src/context.ts 路径/秘密过滤；mcp --readonly 仅冻结快照读权，方向仍由 Codex 发起 |
| [NAMUORI00/cross-review-bridge](https://github.com/NAMUORI00/cross-review-bridge/tree/61ba6108ae59be3860b97adf5baff4bd7bb33489) · `61ba6108ae59be3860b97adf5baff4bd7bb33489` | MIT | 设计借鉴 | 审查材料组织、apply/consider/reject/needs_user、本地验证 | record_findings + 两个 Pro 技能；用户已授权修复时不额外引入审批流程 |
| [openai/tunnel-client](https://github.com/openai/tunnel-client/tree/aa603c51565b6b1f55b5bcf10880d79033fb3987) · `aa603c51565b6b1f55b5bcf10880d79033fb3987` | Apache-2.0 | 间接运行时依赖 | 官方出站 MCP tunnel | 基线 src/tunnel.ts 锁定 v0.0.16 并校验发行文件；表内 SHA 为源码核查快照；运行时不自动跟随 main |
| [Evanlau1798/codex-chatgpt-web](https://github.com/Evanlau1798/codex-chatgpt-web/tree/de76195c82a33fa70ec1cb60a277fe55b0332664) · `de76195c82a33fa70ec1cb60a277fe55b0332664` | MIT | 设计借鉴 | 会话保留、增量恢复、上下文开关互斥 | 基线已有 30 分钟保留；wrapper 实现保留会话与 Bigger Context 互斥，未声称全部 Enhanced 功能移植 |
| [steipete/oracle](https://github.com/steipete/oracle/tree/14ae9f9a00e222d4b08f34ceccafc86b5a3e815f) · `14ae9f9a00e222d4b08f34ceccafc86b5a3e815f` | MIT | 设计借鉴 | 深度研究当前轮次报告归属、附件就绪、图像结果识别 | docs/browser-workflow.md 适配当前原生 Browser Use；src/page-evidence.ts 处理进度/错误；未采用 cookie 下载路径 |
| [Yubo-Cao/codex-chatgpt-pro-bridge](https://github.com/Yubo-Cao/codex-chatgpt-pro-bridge/tree/5f2fbd530db0b7c8d05159571860b9ec2b19c0f9) · `5f2fbd530db0b7c8d05159571860b9ec2b19c0f9` | MIT | 设计借鉴 | 单次发送、两次稳定观察、长任务恢复 | src/jobs.ts 持久 send_pending、nonce、15 秒稳定观察；缺少提交证据时不自动重发 |
| [yuyou-dev/ChatGPT-Bridge](https://github.com/yuyou-dev/ChatGPT-Bridge/tree/6b5eef1343158d37ce2bc4245892f7b3238fc5f0) · `6b5eef1343158d37ce2bc4245892f7b3238fc5f0` | MIT | 设计借鉴 | 原图、批次数量、尺寸/哈希验证 | src/jobs.ts 原图导入验证；下载由原生浏览器完成，非 cookie 或私有下载 API |

## 调研但未采用

| 项目 | 取舍 |
|---|---|
| [Matchameleon/gpt-codex-plugin](https://github.com/Matchameleon/gpt-codex-plugin) | 核查仓库树未发现许可证文件，不移植代码。 |
| [Microck/chatgpt-webui-mcp](https://github.com/Microck/chatgpt-webui-mcp) | 已归档，不作为主干。 |
| [FirstWari/chatgpt-web](https://github.com/FirstWari/chatgpt-web) | stealth/代理轮换不符合本项目的原生浏览器边界。 |
| [yxhpy/chatgpt-pro-browser](https://github.com/yxhpy/chatgpt-pro-browser) | cookie 解密路线不采用。 |
| [Liao330/codex-chatgpt-bridge](https://github.com/Liao330/codex-chatgpt-bridge) | HTTP 默认模式与本项目网页原生交互的主路径不匹配。 |
| [robotlearning123/gpt2agent](https://github.com/robotlearning123/gpt2agent) | 私有 token/REST 路线不采用。 |
| [Fanch-hui/codex-bridge](https://github.com/Fanch-hui/codex-bridge) | 网页为主控的反向多 harness 路线，首版无需再叠一套。 |
| [herrkaefer/micpipe](https://github.com/herrkaefer/micpipe) | GPL 语音 UI 控制，后续研究；未集成/分发。 |
| [miuuyy/ChatGPT-Persona-Voice](https://github.com/miuuyy/ChatGPT-Persona-Voice) | 输出变声不等于网页实时语音代理。 |
| [malhashemi/opencode-gpt-live](https://github.com/malhashemi/opencode-gpt-live) | 不同服务路线，不作为 ChatGPT 网页语音实现。 |

## 源码锚点

- 上游：`src/adapters/chatgpt-web/turn-broker.ts`、`turn-execution.ts`、`src/codex-integration.ts`、`src/tunnel.ts`。
- Oracle：`src/browser/actions/deepResearch.ts`、`src/browser/chatgptImages.ts`；后者读取 cookies 的下载部分明确排除。
- 官方插件规范：[打包插件](https://developers.openai.com/plugins/build/plugins)、[桌面插件](https://developers.openai.com/plugins/deploy/desktop-only)。
- Oracle main 在实施期间推进，本项目仍记录已核查的旧 SHA，未静默升级。
