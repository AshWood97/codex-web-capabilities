# Codex Web Capabilities

由 Codex 发起任务，通过原生 Chrome 调用 ChatGPT 网页的代码审查、持续协作、真正 Deep Research 和图像能力。当前默认使用网页实际可见的 **GPT-6，推理档位“高”**；Pro 暂缓，不阻塞这四类流程。另有可选完整 agent 运行时，语音首版仅保留未实现接口。

**0.1.0 是可安装的验证版。** 2026-10-22 已实测普通 chat CR → Codex 修复 → 测试 → 同会话复审、研究报告提取，以及图像生成和参考图编辑下载；完整 agent 和部分恢复场景仍未验收。具体范围见 [验收记录](docs/acceptance.md) 和 [脱敏实机简报](docs/evidence/2026-10-22-live.md)。接力开发从 [HANDOFF.md](HANDOFF.md) 开始。

## 安装

需要 Node.js 22+、Codex 桌面端及已连接的原生 Chrome 扩展。普通网页流程无需 Bun 或 tunnel。在源码仓库根目录运行：

```sh
npm ci
npm run package
codex plugin marketplace add "$PWD/release/codex-web-capabilities-marketplace"
codex plugin add codex-web-capabilities@codex-web-capabilities-local
```

已有插件发行包时，解压 `codex-web-capabilities-plugin-0.1.0.tar.gz`，将解压出的本地 marketplace 注册到 Codex；也可在桌面插件目录选择该本地来源。安装后刷新当前会话的插件列表。发行包内的 Node MCP 已包含生产依赖，无需在插件缓存中安装 npm 依赖。Git 仓库不提交 node_modules 或 dist；当前桌面端实际加载仍需验收。

本轮候选 archive 已通过独立新 CODEX_HOME 的 CLI 安装、启用、冷启动和卸载验证：缓存无 node_modules，MCP 提供 19 工具，collaborate 默认 chat，两个原生 helper bundle 可导入。未改日常 Codex 配置；这不代表桌面当前会话已加载。

六个技能入口如下。`web-pro-*` 名称为兼容已有调用保留，CR/协作默认是普通 GPT-6 chat。

| 入口 | 用途 |
|---|---|
| `$web-pro-review` | CR、源码快照与行号、本地核验、修复和复审 |
| `$web-pro-collaborate` | 同仓库同会话的多轮咨询与失败反馈 |
| `$web-deep-research` | 真正研究模式、当前轮次报告全文和引用 |
| `$web-image` | 网页生成、参考图编辑、原图导入与批次数量检查 |
| `$web-agent` | 可选完整 agent，尚未完成真实工具循环验收 |
| `$web-diagnostics` | 可见模型/档位、浏览器、任务和运行时诊断 |

## 使用

例如：“用 $web-pro-review 审查当前 diff，验证问题并修复，再用同一会话复审”。Codex 管理本地源码与工具权限，网页提供审查和推理。模型、推理档位、研究/图像功能都从当前绑定页面实际确认；不凭技能名称推断 Pro，也不自动回退模型 API。

任务数据写入用户数据目录，可用 `CWC_HOME` 指定独立位置。任务绑定仓库快照、浏览器、标签页、会话和消息轮次，默认最多两任务并发。发送前持久化 `send_pending`；中断后先观察原会话，不重复发送。静默思考不会自动判失败。

CLI 与 MCP 使用相同命令；CLI 只管理状态和文件，网页动作由 Codex 原生 Browser Use 执行：

```sh
node dist/cli.mjs capabilities
node dist/cli.mjs prepare --input task.json
node dist/cli.mjs list
node dist/cli.mjs status --input job-id.json
```

`task.json` 示例中的仓库路径由使用者填写，仅上传任务相关内容：

```json
{
  "kind": "review",
  "mode": "chat",
  "prompt": "审查本次修改中的可复现缺陷，优先检查边界条件。",
  "context": {
    "root": "/PATH/TO/AUTHORIZED/REPOSITORY",
    "scope": "changes",
    "files": ["src/related-module.ts"]
  }
}
```

`job-id.json` 使用真实本地任务 ID。完整操作见 [原生浏览器工作流](docs/browser-workflow.md)。

## 当前结果与边界

- **CR/协作：** Chrome 普通 chat 的 GPT-6 + 高发现 `shipping.mjs:3` 的免邮边界问题；Codex 修复后 2 项本地测试通过，同会话复审 0 findings。新 Chrome 标签页重开该已保存会话时，两条旧助手回复显示无法加载；当次实时回复和本地保存结果成功，不能据此声称重载恢复通过。
- **持续协作：** 同会话第三轮补充边界需求，网页静态核对 8 种输入并明确未运行测试；Codex 增加 0、正负 Infinity 的 3 个断言，合成仓库 3 项测试通过。任务经新 CLI 进程 resume 和两次稳定观察完成，没有重发；本地补测试后旧快照 stale 属正常。
- **Deep Research：** 组件加载错误后只重试该组件一次，未新增用户消息；取得当前轮次 3832 字符报告。UI 为 9 来源 / 9 引用 / 122 搜索，DOM 正文含 8 条 HTTPS 来源。报告技术断言尚未逐条独立审核，实际澄清/计划分支未触发。
- **图像：** 初始图和参考图编辑结果均为 1254×1254，Chrome 预览 Download 将原图保存到 Downloads，两文件均已打开查看。初始图事件超时后按唯一图名和点击时间定位，没有预点击文件系统基线；编辑图使用完整预点击基线 helper 定位唯一新增文件。`pageAssets` 本轮未覆盖结果 blob，真实多图 batch 仍待验收。
- **本地检查：** 本轮 `npm run check` 通过 31 项自动测试，六技能 `quick_validate` 也全部通过。离线状态机和模拟页面测试与上述实机观察分别记录，不替代完整 agent、真实长任务或桌面加载。

源码默认范围为 diff 加相关文件，可选 repository/files；覆盖范围、排除项和过期状态会明确记录。发送前需核对材料，秘密扫描只是启发式过滤。研究拒收普通长回复、旧报告和进度占位；图像只导入当前轮次原文件，继续检查格式、尺寸、重复与数量，截图不充当原图。可选只读 MCP 仅提供冻结快照读取；实时语音返回 `not_implemented`。

## 可选完整 agent

默认四类网页流程一直使用 Chrome。可选完整模式复用锁定上游的独立 Browser 和 task-bound tool broker，将网页模型接入 Codex 原生工具循环，因此另需 launcher 登录、MCP/tunnel 权限及独立配置。它尚未接入默认 Chrome 标签页，也不迁移 Chrome cookies。

当前上游为 `miuuyy/codex-chatgpt-web` v6.1.13，固定 SHA `6f43747eb5585ca623c0617e729826dfd680c5b7`，源码和依赖已准备。上游 `app` → launcher `dev` 会进入忽略 wrapper 隔离目录、使用模拟工具的 `--dev-profile`；已改用 production `start`，真实构建启动成功，界面显示 v6.1.13 且无 DEV。窗口停在首次引导，独立登录和平台授权尚未完成；`runtime doctor` 返回 `ok=false`、缺少 `config.json` 并提示 Run setup。尚无真实读取→修改→终端测试的工具循环，不能把启动成功算作完整编码通过。步骤与配置边界见 [运行时说明](docs/runtime.md)。

## 开发与交接

在源码目录运行 `npm run check` 完成类型、自动测试、许可证和插件格式检查；发行构建使用 `npm run package`。完成同一候选的必要检查后，只有新改动或新失败才需要重复扩大验证。

[接力计划](docs/plans/2026-10-16-agent-handoff.md) 保留 shipping fixture、真实证据标准和剩余验收项；[证据索引](docs/evidence/README.md) 区分当前实测摘要和历史日志。[参考项目](docs/reference-projects.md) 记录固定快照、许可证、模块与修改方式，[第三方声明](THIRD_PARTY_NOTICES.md) 保留依赖许可证；当前没有上游代码移植。

卸载通过 Codex 插件目录或 `codex plugin remove codex-web-capabilities@codex-web-capabilities-local`；配置过可选运行时的使用者先按运行时文档执行 rollback 并关闭 launcher。任务、图片和证据默认保留，后续删除由使用者决定。
