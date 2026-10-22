# 验证证据

当前结果以 [验收记录](../acceptance.md) 为准。证据按日期和验证层级区分，旧日志不自动继承为新候选通过。

## 2026-10-22

[2026-10-22-live.md](2026-10-22-live.md) 是本轮受控 Chrome 观察与本地结果的脱敏简报，记录 GPT-6 普通 chat 三轮 CR/修复/复审/协作、合成仓库 3 项测试、新 CLI 进程 resume、真正研究报告恢复、图像与参考编辑下载、CR 网页重载限制，以及 production launcher 的实际边界。它不包含私人会话 URL、扩展身份、任务数据库或原始账户状态。

本轮最终 `npm run check` 的 31 项自动测试通过，六技能 `quick_validate` 也全部通过，记录范围为本项目；不替代真实超过 1 小时、多图 batch、研究澄清/计划、完整 agent 写工具断连、线上回滚或桌面加载。production launcher 已构建启动，独立登录与配置尚未完成，不能据此声明完整 agent 成功。

候选 archive 另已通过独立新 CODEX_HOME 的本地 marketplace/plugin 安装启用、无 node_modules 缓存内 19 工具冷启动、collaborate 默认 chat、两个 helper bundle 导入及卸载/移除来源。日常 Codex 配置未修改，桌面当前会话加载仍未验收。

## 2026-10-16 历史基线

`2026-10-16/` 为当时测试日志的脱敏副本。用户名、绝对工作区和临时路径已替换为占位符。以下结论只属于当时的代码和旧上游 pin：

| 文件 | 当时能证明什么 | 不能证明什么 |
|---|---|---|
| `handoff-check.log` | 交接文档加入后，21 项测试、类型和打包格式检查通过 | 10 月 22 日候选或新增网页验收 |
| `work-check.log` | 当时本项目 21 项测试、类型、许可证生成与格式检查通过 | 当前完整网页链路可用 |
| `upstream-tests.log` | 旧 pin `f137c2f84da5df214c1e228d74f5ff43e7641c48` 的 7 文件、143 测试、1276 断言通过 | 新 pin `6f43747…` 的测试或真实工具循环 |
| `upstream-build.log` | 旧 pin 运行时 bundle 构建成功 | 当前 production launcher 或编码实机结果 |
| `archive-verification.log` | 当时源码包在新目录安装依赖、构建检查通过 | 后续发行物均已验证 |
| `installation-results.json` | 独立 CODEX_HOME 的 CLI marketplace 安装和启用 | 当前桌面会话已加载技能 |
| `uninstallation-results.json` | 当时卸载保留预设配置及新增用户字段 | 完整在线 setup/rollback 实测 |
| `cold-start-result.json` | 当时无 node_modules bundle 启动，19 工具可见 | 网页登录、模型或桌面加载 |
| `runtime-wrapper-results.json` | 当时固定版本准备和上下文互斥拒绝检查 | 当前 configure/doctor/exec 成功 |

原始私人截图、完整网页会话和任务数据库未纳入公开证据。截图可用于检查页面，不能作为图像原文件交付。

## 后续记录

新日志注明日期、候选版本/commit、运行时版本、命令与范围；网页观察另外注明真实模式、当前轮次归属、完成或失败状态及限制。自动测试、上游测试和真实工具循环分别记录。不要提交凭证、nonce、tunnel key、浏览器 profile、扩展身份、主机绝对路径或私人会话 URL。
