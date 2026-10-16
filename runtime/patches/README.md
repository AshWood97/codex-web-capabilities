# 上游补丁清单

基线 f137c2f84da5df214c1e228d74f5ff43e7641c48；当前 sourcePatches=[]。

30 分钟保留已存在于 src/adapters/chatgpt-web/turn-execution.ts 和 launcher/electron/browser-host.cjs。增量续接、turn broker、compaction、取消、Responses SSE 使用上游真实实现。额外策略在本项目 src/runtime.ts 中实现：独立配置目录、native 协议、不开自动批准、会话/Bigger Context 互斥、安装阶段和运行证据记录。

因此当前没有把相同增强代码再 patch 一次，也不声称 fork 的所有增强已移植。后续新增源码补丁必须写入 integration-policy.json，包含文件名、原/新哈希、来源 commit、许可证、改动理由和对应回归测试；不能通过 checkout main 自动升级。
