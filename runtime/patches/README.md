# 上游补丁清单

基线 v6.1.13，固定 SHA 6f43747eb5585ca623c0617e729826dfd680c5b7；当前 sourcePatches=[]。

30 分钟保留已存在于 src/adapters/chatgpt-web/turn-execution.ts 和 launcher/electron/browser-host.cjs。增量续接、turn broker、compaction、取消、Responses SSE 使用上游真实实现。额外策略在本项目 src/runtime.ts 中实现：独立配置目录、native 协议、不开自动批准、会话/Bigger Context 互斥、安装阶段和运行证据记录。

launcher 的生产入口也由 wrapper 选择：构建 browser helper、运行 launcher build、运行 launcher start。上游 app/dev 链会传入 --dev-profile 并启用模拟工具；wrapper 使用同一 CWC_HOME 下的隔离生产目录，显式指定 Bun，清理相关继承环境覆盖。此修复没有修改上游源码。

因此当前没有把相同增强代码再 patch 一次，也不声称 fork 的所有增强已移植。后续新增源码补丁必须写入 integration-policy.json，包含文件名、原/新哈希、来源 commit、许可证、改动理由和对应回归测试；不能通过 checkout main 自动升级。
