# 接力入口：Codex Web Capabilities

更新日期：**2026-10-22**。当前版本 **0.1.0 验证版**。默认四类网页流程使用原生 Chrome 和实际可见的 GPT-6；本轮 CR/协作使用“高”档位，Pro 暂缓。

先读 [验收记录](docs/acceptance.md) 和 [接力计划](docs/plans/2026-10-16-agent-handoff.md)，保留已有实现与已完成结果。真实观察摘要在 [实机简报](docs/evidence/2026-10-22-live.md)，历史日志见 [证据索引](docs/evidence/README.md)。

## 已完成

- 本地 TypeScript MCP、19 个工具、六个技能、持久任务、单次发送、仓库快照和冻结快照只读接口。
- 本轮 `npm run check` 的 **31 项自动测试通过**，六技能 `quick_validate` 全部通过。自动测试涵盖新增普通 chat 模式与原生下载 helper；历史 21 项和旧上游 143 测试 / 1276 断言不作新 pin 结果。
- Chrome 普通 GPT-6 chat + 高完成 CR → Codex 修复 → 2 项本地测试通过 → 同会话复审 0 findings，定位问题为 `shipping.mjs:3` 的免邮边界。
- 同会话第三轮持续协作静态核对 8 种输入；网页明确未运行测试，Codex 补 0、正负 Infinity 的 3 个断言，合成仓库 3 项测试通过。新 CLI 进程 resume 无重发，任务两次稳定观察后完成；新增测试使先前快照 stale，符合设计。
- 真正 Deep Research 在组件加载错误后重试组件一次恢复，未新增用户消息；提取当前轮次 3832 字符报告。UI 9 来源 / 9 引用 / 122 搜索，DOM 8 条 HTTPS 来源；未逐条独立审核报告技术断言。
- 初始原图 1,721,014 bytes，编辑原图 1,660,188 bytes，均为 1254×1254 且已打开查看。Chrome 预览 Download 落盘；初始图事件超时后按唯一图名/点击时间定位，没有预点击文件系统基线，编辑图才使用完整基线 helper。pageAssets 未暴露结果 blob。
- 可选上游 v6.1.13 固定 SHA `6f43747eb5585ca623c0617e729826dfd680c5b7` 的 `runtime prepare` 源码与依赖已就绪。
- production launcher 已真实构建启动，界面显示 v6.1.13、无 DEV，保留 wrapper 隔离目录；停在首次引导。
- 候选 archive 已构建；独立新 CODEX_HOME 安装 marketplace/plugin 后 list enabled，缓存无 node_modules，MCP 冷启动 19 工具、collaborate 默认 chat，两个 helper bundle 可导入，卸载/移除来源通过。日常 Codex 配置未改；桌面当前会话加载未验收。

最终发行物已按冻结文档重新生成：本地 marketplace 插件包与源码包。后续源码变更仍需重新构建，不将旧上游测试当作新 pin 的结果。

## 下一步

| 优先级 | 待办 | 当前限制与完成标准 |
|---|---|---|
| P0 | 完整 agent 的独立登录、配置与工具循环 | 已修复 `app` → `dev` / `--dev-profile` 的模拟工具入口，production launcher 真实启动成功。使用者尚未完成独立登录和平台授权；doctor 返回 `ok=false`，提示缺少 `config.json`、Run setup。之后还需 MCP/tunnel 权限、真实读取/修改/终端测试事件与本地结果，才能验收。 |
| P1 | 已保存 CR 会话的网页重载 | 新 Chrome 标签页重开已存会话后，两条旧助手回复无法加载；当次实时回复和本地结果成功。保留原结果并定位重载限制，不能把本轮 CR 成功写成 reload 恢复通过。 |
| P1 | 研究澄清与计划分支 | 本轮研究直接完成，未触发实际澄清或计划确认；需要网页真实触发时验证同任务新轮次和报告归属。 |
| P1 | 真实多图 batch | 目前只验证初始图和单图参考编辑；需实际多图、数量不足和重复图拒收，不用截图补齐数量。 |
| P1 | 真实长任务及写工具断连 | 本轮第三轮任务的新 CLI 进程 resume 已通过，未重发；真实超过 1 小时网页任务与完整写工具断连尚未验收。恢复时查明原操作状态，不重发或重放不确定写入。 |
| P1 | 线上 setup/rollback 与桌面加载 | 当前候选包独立 CLI 安装、冷启动和卸载通过；完整在线配置、回滚保留后续用户字段，以及桌面六技能/MCP 实际加载仍待验收。 |

语音首版只保留 `not_implemented` 接口，不在这次接力实现范围。完整 agent 的阻塞不应阻止其余 Chrome 流程。

## 浏览器与权限

CR、持续协作、研究、图像一直由 Codex 原生 Browser Use 操作 Chrome。完整 agent 当前沿用上游独立 Browser + tool broker，所以需要单独登录；这不是把默认四流程改到另一个浏览器。不得复制 cookies、浏览器 profile、凭证或主账号 auth 来填补独立登录。

保留原审批、沙箱和模型路由；不启用自动批准，不把网页普通文本执行为 shell，不用模型 API 或私有 HTTP 接口替代网页权限。登录、CAPTCHA 和连接器授权由使用者按平台流程完成。公开证据不包含主机绝对路径、nonce、扩展身份、私人会话 URL 或任务数据库。

## 源码入口

| 文件 | 用途 |
|---|---|
| [src/api.ts](src/api.ts)、[src/types.ts](src/types.ts) | 参数、chat/pro/research/image 模式与观察合同 |
| [src/jobs.ts](src/jobs.ts)、[src/store.ts](src/store.ts) | 预约、确认、恢复、澄清、结果与持久化 |
| [src/context.ts](src/context.ts) | 快照、覆盖范围、秘密过滤、行号与 stale |
| [src/page-evidence.ts](src/page-evidence.ts) | 页面错误和进度分类；不凭全页完成字样判成功 |
| [src/native-browser.ts](src/native-browser.ts)、[src/native-downloads.ts](src/native-downloads.ts) | pageAssets 精确资源导出及正常下载的文件名基线定位 |
| [src/runtime.ts](src/runtime.ts)、[docs/runtime.md](docs/runtime.md) | 固定上游、生产 launcher、独立配置与回滚 |
| [docs/browser-workflow.md](docs/browser-workflow.md)、[skills/](skills/) | 当前原生浏览器流程；每次按运行时文档确认 API |

## 交给接力 Agent 的提示

> 阅读 HANDOFF、验收记录、接力计划和当前差异后，只继续未完成项。默认 Chrome 普通 GPT-6 chat，实际核对模型与档位，Pro 暂缓。复用已验证的 CR、本地修复、研究报告和单图编辑下载结果；关注 production launcher、独立登录及真实工具循环、CR 重载限制、研究澄清/计划、真实批次和长任务恢复。常规范围内修复直接做，缺少登录或平台授权时保留页面，只暂停受影响项。未知提交先查原会话，不重复发送；未知写工具状态不重放。把自动测试、真实网页观察和完整 agent 工具事件分别记录。不要复制登录状态、关闭审批/沙箱或自动切模型 API。仅发布脱敏证据，完成后同步验收和发行范围。
