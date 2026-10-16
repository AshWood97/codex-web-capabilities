# 接力入口：Codex Web Capabilities

交接日期：2026-10-16。当前版本 **0.1.0 验证版，真实账户验收未完成**。

目标是让用户始终在 Codex 发起任务、看进度、收结果，调用 ChatGPT 网页 Pro 做 CR、持续协作，并支持真正的网页 Deep Research、图像及可选完整编码运行时。语音首版只保留接口。

**下一位执行者先读 [详细执行计划](docs/plans/2026-10-16-agent-handoff.md)，再读 [验收记录](docs/acceptance.md)。不要重新从零实现，也不要把已有离线测试当作网页实测。**

## 接力前准备

1. 此 GitHub 仓库已按用户要求公开；clone 后运行 `npm ci && npm run check`。推送修改仍需仓库写入权限，也可通过 fork 提交 Pull Request。
2. 使用自己的已授权 ChatGPT 网页会话，在 Codex 原生 Chrome 扩展中实际确认 Pro 模型可选。Codex 客户端已登录 Pro 不代表网页也已登录；不传递原开发者的 cookies、账户或任务数据库。
3. 运行 `npm run package`，安装 `release/codex-web-capabilities-marketplace`，参照 [README](README.md)。CLI 管状态，Codex 技能操作网页；仅启动 MCP 不会自动驾驶浏览器。
4. 优先完成 Pro CR → 修复 → 测试 → 同会话复审，然后按下表继续。

## 已完成的基础

- TypeScript 本地 MCP、19 个工具、六个 Codex 技能、可安装本地 marketplace 和源码打包。
- 仓库快照、源码行号/哈希、覆盖范围与排除记录、过期审查判断。
- 持久任务、两任务并发、标签页/会话隔离、发送前预约、断开后观察恢复、澄清轮次记录。
- 研究当前轮次归属及引用检查；原图路径/格式/尺寸/哈希/数量检查；只读快照令牌。
- 独立完整运行时的固定 SHA 安装、配置事务、健康检查、原生 Codex CLI 调用入口和回滚包装。
- 参考项目、固定版本、采用方式和第三方许可证清单。
- 本项目 21 项自动化测试；锁定上游 7 个测试文件的 143 项测试 / 1276 断言通过。
- 真实 Chrome 图像生成成功，发送后标签页丢失的会话恢复曾成功，未重复发送。

上述“基础已完成”不代表所有用户流程已可用。真实 Pro、研究报告、完整编码仍必须按下面的完成标准验收，发现实现缺口后修复。

## 未完成清单

| 优先级 | 待办 | 当前事实 / 阻塞 | 完成标准 |
|---|---|---|---|
| P0 | Pro CR 与同会话复审 | 原机器默认 Chrome 为 Plus，无 Pro；另一网页会话未登录，尚未发送 Pro CR | 在真实可见 Pro 模型发现预置 `shipping.mjs:3` 边界缺陷；本地核对/记录；修复并测试；同会话复审；旧快照变 stale |
| P0 | 持续协作 | 状态机与 parent 续接离线通过，真实多轮未验证 | 补充上下文、反馈测试失败、修复和复审留在同仓库/会话；记录每轮真实消息与模型 |
| P0 | 网页 Pro 完整 agent 编码 | 上游构建和选定测试通过；独立浏览器登录、tunnel/连接器授权和真实工具循环未完成 | 真实网页模型驱动文件读取、修改、终端测试和多轮调用；JSONL 及本地 diff/test 证明；验证中断不重放写操作 |
| P0 | 真正 Deep Research 完整报告 | 真实选择研究模式后网页报“无法打开／未能显示 深度研究”；没有报告 | 可用账户完成真实研究；只提取本任务 report/iframe 全文与引用；拒绝旧报告、占位和普通长回答 |
| P1 | 原图下载、参考图编辑、批次 | 网页生成成功；当前 Browser Use 不支持该 blob 下载，下载事件曾超时；未拿到原文件 | 原生导出可打开的原图；参考图编辑；缺图/重复图不得完成；不以截图替代 |
| P1 | 真实长任务与故障恢复 | 注入时钟模拟 >1 小时、真实进程重启/并发测试通过；真实 >1 小时运行未验收 | 真实长任务与断连/进程重启后不重发，不跨会话取结果；工具写入不重放 |
| P1 | 完整运行时安装/回滚及桌面加载 | 本地 CLI 插件安装/卸载通过；完整在线 setup/rollback、桌面技能可用性未验收 | 原审批/沙箱/模型/多 agent 及后加用户字段保留；冲突不覆盖；桌面可发现六技能及 MCP |
| P1 | 整体结果与打包收尾 | 当前是验证包 | 更新真实验收证据、限制、参考锁和许可证；重新打包并验证干净环境安装 |
| 范围外 | 实时语音实现 | `voice` 明确返回 `not_implemented` | 首版保持接口；不启动麦克风，不用 TTS 冒充实时语音 |

用户已明确接受本轮“图像生成成功即可”，因此原图下载不阻塞这次 GitHub 交接。但最终产品仍保留原图/编辑/批次要求；不能因此把 partial 任务改为 completed 或删除校验。

## 关键入口

| 文件 | 接力时用途 |
|---|---|
| [src/api.ts](src/api.ts)、[src/types.ts](src/types.ts) | MCP/CLI 参数和状态契约；浏览器观察字段以这里为准 |
| [src/jobs.ts](src/jobs.ts)、[src/store.ts](src/store.ts) | 预约/确认、恢复、澄清、结果、锁与持久化 |
| [src/context.ts](src/context.ts) | Git 快照、范围、秘密启发式过滤、源码包和 stale |
| [src/page-evidence.ts](src/page-evidence.ts) | 当前 DOM 摘录分类；错误不能被页面“回答已完成”掩盖 |
| [src/runtime.ts](src/runtime.ts)、[docs/runtime.md](docs/runtime.md) | 可选完整运行时的实际入口和固定版本 |
| [docs/browser-workflow.md](docs/browser-workflow.md)、[skills/](skills/) | Codex 实际执行浏览器步骤；动态读取当前工具 API |
| [docs/reference-projects.md](docs/reference-projects.md) | 实际采用与调研未采用的上游、许可证和固定 SHA |
| [docs/evidence/README.md](docs/evidence/README.md) | 已有脱敏日志及它们能证明的边界 |

## 直接交给接力 Agent 的提示

> 请在此仓库继续完成 `docs/plans/2026-10-16-agent-handoff.md` 的待实施规格。先阅读 `HANDOFF.md`、`docs/acceptance.md`、当前代码和差异，保留已有实现。先检查当前浏览器已授权网页会话能否选择 Pro，再按 Pro CR/持续协作、真正 Deep Research、图像、完整 agent 运行时、恢复与发布收尾的依赖顺序执行。默认 Codex 主控，不自动换成模型 API；真实网页权限及登录由使用者完成。常规修复直接做，实际缺少登录或平台授权时只暂停受影响项。每项提供真实模型/轮次/工具事件、脱敏结果和测试证据，区分离线测试与真实账户验收。不要用 mock 或构建成功宣称完整编码完成。语音首版不实现。不得读取或迁移原作者 cookies、密钥或登录状态；不要把凭证、nonce、浏览器 profile、任务数据库提交 Git。完成后更新验收矩阵和打包产物，汇报实际改动、未通过项及恢复方法。
