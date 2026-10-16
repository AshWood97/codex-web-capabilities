# Codex Web Capabilities

由 Codex 统一调用 ChatGPT 网页的 Pro 审查、持续协作、深度研究和图像能力；可选安装锁定的完整编码运行时。语音首版明确未实现。

**0.1.0 为可安装的验证版。** 接口、离线测试、真实账户验收是不同层级。当前实机限制见 [验收记录](docs/acceptance.md)；不能把配置成功或 mock 测试当作 Pro 全程编码已验证。

**接力开发从 [HANDOFF.md](HANDOFF.md) 开始。** 未完成清单、源码入口、复现步骤和可直接交给 Agent 的提示都已整理；详细待实施规格见 [执行计划](docs/plans/2026-10-16-agent-handoff.md)。

从 Git 仓库安装时，先 `npm ci && npm run package`，再将下文的 marketplace 路径替换为仓库内 `release/codex-web-capabilities-marketplace` 的绝对路径。Git 仓库不提交 node_modules 或 dist，安装包由锁文件和源码构建。

## 安装

需要 Node.js 22+、Codex 桌面端以及已连接的原生 Chrome 扩展。普通网页流程无需 Bun 或 tunnel。

解压 `codex-web-capabilities-plugin-0.1.0.tar.gz`，然后注册解压出的本地 marketplace：

```sh
codex plugin marketplace add /absolute/path/to/codex-web-capabilities-marketplace
codex plugin add codex-web-capabilities@codex-web-capabilities-local
```

也可在桌面端插件目录选择该本地来源安装。安装后刷新当前会话的插件列表。发行目录包含已打包的独立 Node MCP 程序，无需在插件缓存中 npm install。此分发为本地验证包，未发布到公共商店。

插件保留 `.codex-plugin/plugin.json` 兼容格式，MCP 通过官方 `${PLUGIN_ROOT}` 变量定位 dist/mcp.mjs。六个入口：

| 入口 | 用途 |
|---|---|
| `$web-pro-review` | Pro CR，快照与行号、采纳核验、修复复审 |
| `$web-pro-collaborate` | 同仓库同会话的多轮咨询、失败反馈 |
| `$web-deep-research` | 真正网页研究模式、报告全文和引用 |
| `$web-image` | 网页生成/参考图编辑、原图和批次校验 |
| `$web-agent` | 可选网页 Pro 驱动原生 Codex 工具循环 |
| `$web-diagnostics` | 可见模型/功能、浏览器、任务与运行时诊断 |

## 任务使用

在 Codex 描述任务并调用相应技能，例如：“用 $web-pro-review 审查当前 diff，验证问题并修复，再用同一会话复审”。默认 Codex 主控，网页提供推理。全程从 Codex 发起、看进度、收结果。

数据保存在 `~/.local/share/codex-web-capabilities`，可设置 CWC_HOME。任务将仓库快照、浏览器身份、标签页、会话、消息轮次绑定。默认两任务并发；在排队状态的任务可在槽位释放后 bind。发送前持久化 send_pending；中断后先恢复原会话，不重发。静默思考不会因超时自动失败。

没有 MCP 的测试环境可使用同包 CLI（命令与 MCP 名称一致）：

```sh
node dist/cli.mjs capabilities
node dist/cli.mjs prepare --input task.json
node dist/cli.mjs list
node dist/cli.mjs status --input job-id.json
```

`task.json` 示例（源码只传任务相关内容）：

```json
{
  "kind": "review",
  "prompt": "审查本次修改中的可复现缺陷，优先检查边界条件。",
  "context": {
    "root": "/absolute/repository/root",
    "scope": "changes",
    "files": ["src/related-module.ts"]
  }
}
```

`job-id.json` 内容是 `{"id":"实际任务 UUID"}`。CLI 只管理状态和文件；它不会在后台操作网页。后续绑定、发送与观察由技能按 [原生浏览器工作流](docs/browser-workflow.md) 调用当前 Browser Use。

## 范围与结果

- 源码默认 diff + 相关文件，可选 repository 或 files；上限 4 MiB、单文件 1 MiB。秘密、二进制、链接和构建产物被排除并列出。超限明确失败，不静默截断。启发式秘密扫描不保证识别所有秘密，发送前仍需核对本次材料。
- CR 存储优先级、文件行号、证据、建议和本地采纳结果。快照过期拒绝采纳；修复后通过 parent 续接。
- 研究必须有当前轮次的真实研究模式、完整报告和引用；进度/旧报告/普通 Pro 长回复不能成功。
- 图像只接受原生导出的原文件，校验魔数/尺寸/哈希/数量。截图仅用于验证；下载失败保持 partial。
- 可选只读 MCP：`node dist/mcp.mjs --readonly`，仅 read_snapshot；令牌绑定冻结快照，30 分钟过期，任务结束/取消撤销。不要把完整任务管理 MCP 暴露给网页。
- voice 返回 not_implemented，不开启麦克风、不替换成 TTS。

可选完整模式、独立浏览器登录、tunnel 授权、保留会话与 Bigger Context 互斥、回滚流程见 [运行时说明](docs/runtime.md)。网页账户和工具的实际可用性必须在诊断时核实，不承诺特定型号或额度，也不降级为模型 API。

## 开发与验证

以下命令在源码包目录运行；安装包已含编译产物，不含开发测试依赖。

```sh
npm ci
npm run check
npm run package
```

Node/TypeScript + MCP SDK，dist 已 bundle 生产依赖。测试覆盖状态机、恢复/隔离、上下文与秘密过滤、图像缺图、当前报告归属、MCP stdio 及固定页面错误样本。可选上游的测试独立记录。

[参考项目与采用记录](docs/reference-projects.md) 包含固定 SHA、许可、模块与取舍；[第三方声明](THIRD_PARTY_NOTICES.md) 包含生产依赖许可证。设计借鉴、代码移植和运行时依赖明确区分。

卸载本地插件用 Codex 插件目录或 `codex plugin remove codex-web-capabilities@codex-web-capabilities-local`。可选运行时先 `runtime rollback` 并关闭 launcher。任务和原图默认保留，后续删除由用户决定。
