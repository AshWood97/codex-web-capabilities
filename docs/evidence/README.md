# 验证证据

`2026-10-16/` 为原开发机器的测试日志脱敏副本。本机用户名/绝对工作区和临时路径替换为占位符；保留测试结果、错误和固定版本。它们是交接前基线记录，不意味着未来修改自动继承通过状态。

| 文件 | 能证明什么 | 不能证明什么 |
|---|---|---|
| `handoff-check.log` | 加入交接文档后重新执行检查，21 项测试、类型检查及打包格式校验通过 | 新增真实账户验收 |
| `work-check.log` | 本项目类型检查、21 项自动测试、许可证生成及插件格式检查通过 | Pro / Deep Research / 图像完整网页端到端可用 |
| `upstream-tests.log` | 上游固定 SHA 的 7 文件、143 测试、1276 断言通过 | 当前账号 tunnel 或真实网页工具循环已成功 |
| `upstream-build.log` | 上游运行时 bundle 构建成功 | 完整编码实机验收 |
| `archive-verification.log` | 初始源码包在新目录安装依赖及构建检查通过 | 后续交接文档修改版本的所有新产物均已测试 |
| `installation-results.json` | 独立 CODEX_HOME 的本地 marketplace 安装和启用成功 | 桌面端当前会话已经加载技能 |
| `uninstallation-results.json` | 卸载/移除来源保留预设配置及安装后新增字段 | 完整在线 runtime setup 的回滚实测 |
| `cold-start-result.json` | 无 node_modules 的插件 bundle 启动，19 工具可见 | 网页登录或 Pro 可用 |
| `runtime-wrapper-results.json` | 固定 SHA 准备和上下文配置互斥检查；预期冲突返回 code=1 | runtime configure / doctor / exec 的成功实测 |

原机器的网页截图、私人会话 URL 和完整任务数据库未提交到 Git。真实网页结果与限制见 `../acceptance.md`；接力时收集自己的脱敏证据。图像截图只用于证明生成，不是原图产物。

新增日志应记录候选 commit、命令、运行时版本和测试范围；新网页证据明确实际模式、任务轮次以及完成/失败状态。不要提交凭证、nonce、tunnel key、浏览器 profile 或私人会话正文。
