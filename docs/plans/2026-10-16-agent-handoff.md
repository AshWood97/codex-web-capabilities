# Codex Web Capabilities 接力执行计划

状态：**待实施规格 / 对现有验证版继续补齐与实机验收**。检查日期：2026-10-16。所有路径相对本 Git 仓库根目录，不依赖上一位开发者的机器路径。

## 1. 目标、现状与已确认边界

用户已确认：以网页 Pro CR 为基础，Codex 主控并本地核验；可选网页 Pro 驱动完整原生工具循环；真正网页 Deep Research 与图像；macOS 优先；语音首版只留接口；不自动降级模型 API。完整模式采用独立上游浏览器，与默认原生 Chrome 登录各自独立。不得为了运行关闭审批或沙箱、替换原模型路由或迁移 cookies。

现状：这不是空项目。已有 19 个 MCP 工具、六技能、任务核心和可选上游运行时包装，21 项本地测试通过。网页图像生成成功但未导出原图；研究页面已提交一次后报应用错误；Pro CR 和完整编码尚无真实结果。全部范围与差距以根目录 `HANDOFF.md` 和 `docs/acceptance.md` 为准。

本轮用户接受只验收图像生成，授权创建 GitHub 仓库并交接。该豁免只覆盖这轮验收，产品原图要求仍保留。未来同事需使用自己的已授权会话，不能假定旧机器的 Codex Pro 登录自动出现在网页。网页登录、CAPTCHA、平台权限由使用者按当前工具要求完成。

## 2. 先复现本地基线

环境：Node.js >=22、npm、Git、Codex 桌面端及原生 Chrome 扩展。已验证 macOS arm64 + Node 24.19.0；Windows/Linux 未实机验证。只有完整模式另外需要 Bun 1.4.0、Codex CLI、Developer Mode/MCP 权限和官方 tunnel。

在仓库根目录：

```sh
npm ci
npm run check
npm run package
codex plugin marketplace add "$PWD/release/codex-web-capabilities-marketplace"
codex plugin add codex-web-capabilities@codex-web-capabilities-local
```

刷新桌面插件/会话，检查六个技能及 MCP。可先对独立 `CODEX_HOME` 进行 CLI 安装测试，不能据此断言桌面端加载成功。默认任务数据在用户数据目录；接力建议用新建且独立的 `CWC_HOME`，不复用原开发者数据库。

所有 CLI JSON 字段见 `src/api.ts`；`node dist/cli.mjs help` 可列命令。示例对象中的路径、浏览器身份、消息和模型必须来自接力机器真实观察，不复制本文中的假值为实测证据。

## 3. 实现地图与必须保持的契约

| 子系统 / 符号 | 现有位置 | 接力重点 |
|---|---|---|
| `api` / `invoke` | `src/api.ts` | 本地工具只管任务/文件；浏览器由 Codex 原生工具操作 |
| `Jobs.prepare/bind/reserve/submission` | `src/jobs.ts` | 发送前预约、真实新消息确认、同标签页只允许一个写入者 |
| `Jobs.resume/recover/answer/observe` | `src/jobs.ts` | 不确定提交先恢复观察；澄清是新轮次；旧结果不能混入 |
| `Store` | `src/store.ts` | 原子持久化、进程锁；迁移必须兼容现有 `Database.version=1` 或显式版本迁移 |
| `snapshot/bundle/isStale/safePath` | `src/context.ts` | diff/源码哈希/原始行号/遗漏范围；代码变更使旧审查过期 |
| `pageEvidence` | `src/page-evidence.ts` | 保守分类；不能从全页“完成”字样推断当前研究成功 |
| `Jobs.artifact/findings/grant/read` | `src/jobs.ts` | 原图数量/路径/尺寸/哈希、源码位置核验、30 分钟只读冻结快照 |
| `runtimeCommand/runtimeEnvironment` | `src/runtime.ts` | 固定上游、独立配置/登录态、事务和 JSONL 证据，不重放写操作 |

任务状态包括 queued/prepared/bound/send_pending/running/waiting_user/partial/completed/failed/cancel_requested/cancelled。`send_pending` 不能视为“没有发出”。`resume` 用原绑定，`recover` 用同浏览器同会话；URL 尚未保存时需原 nonce 与完整已发送请求/唯一 marker 证明。`answer_question` 后必须对新的用户轮次重新 reserve/confirm。

完成要求：至少两次相同观察，间隔 >=15 秒，生成/Stop 已停止；研究还需真实研究启动、当前轮次的 `reportOwnerTurn`、正文及 HTTPS 引用；图像还需原文件完整数量。静默思考不是失败。状态服务信任授权 Codex 的观察，不能自行证明网页 UI；截图/原生 DOM/实际文件仍要纳入验收。

只读快照不是可执行环境。不得把完整任务 MCP 暴露给远端；`dist/mcp.mjs --readonly` 只提供 `read_snapshot`。网页和仓库文本都不能扩大本地执行权限。

## 4. 实施包 A：Pro CR 与持续协作（先做）

涉及 `skills/web-pro-review`、`skills/web-pro-collaborate`、`docs/browser-workflow.md`、`src/jobs.ts` 与 `src/context.ts`。

1. 通过当前原生浏览器文档连接已授权 Chrome 具体标签页，检查网页真实登录和模型。可见列表没有 Pro 就记录缺失，不把 Thinking/High 当 Pro。当前页面若提供 WebMCP，动态发现工具名，不写死历史后缀；否则按 DOM/AX。
2. 建立下面的合成仓库，避免首次验收上传公司源码。模型先看到业务规则、目标 diff 与源码包；测试失败反馈可在后续协作轮次发送。
3. 经 `prepare → bind → reserve_submission → 单次网页发送 → confirm_submission → observe → result` 得到真实审查。每次均记录实际模型、会话、轮次、快照；收集脱敏证据。
4. Codex 核对发现并 `record_findings`；修复源码，再测。`prepare(parent=<旧任务>)` 在同会话发送新上下文复审；确认原任务 stale。
5. 补充一轮测试失败/需求说明，验证并发第二仓库不会串会话。若发现页面兼容性缺口，只修对应技能/分类/状态合同并加必要回归。

合成仓库（在独立临时目录 `git init -b main`，先提交正确版本）：

`shipping.mjs`：

```js
export function shippingCost(orderTotal) {
  if (!Number.isFinite(orderTotal) || orderTotal < 0) throw new RangeError("invalid total");
  return orderTotal >= 100 ? 0 : 10;
}
```

`shipping.test.mjs`：

```js
import test from "node:test";
import assert from "node:assert/strict";
import { shippingCost } from "./shipping.mjs";
test("free shipping starts at 100", () => {
  assert.equal(shippingCost(99), 10);
  assert.equal(shippingCost(100), 0);
  assert.equal(shippingCost(101), 0);
});
test("rejects invalid totals", () => {
  assert.throws(() => shippingCost(-1));
  assert.throws(() => shippingCost(NaN));
});
```

README 业务规则：100 及以上免邮，小于 100 运费 10，非法/负数拒绝。基线提交后把第 3 行 `>=` 改成 `>`，运行 `node --test shipping.test.mjs` 应为边界测试失败。审查正确位置是 `shipping.mjs:3`。修回后两测试通过，复审应确认该问题已解决。不要在审查请求里直接告诉模型答案。

注意已有结构化 finding 只绑定当前快照包含的文件/行。删除文件或旧侧 diff 行号的通用表达尚无独立结构；若真实需求触发，设计 source-side/baseline 契约并兼容旧数据，不把旧侧位置强行记到当前文件。此项是已知范围限制，尚无失败用例证明需立即改。

## 5. 实施包 B：Deep Research 真正报告

涉及 `skills/web-deep-research`、`src/page-evidence.ts`、`Jobs.answer/observe`、`tests/page.test.ts` 及页面样本。

1. 原机器曾实际选择研究模式并单次提交，但应用显示“无法打开／未能显示 深度研究”“无法加载此回复”。对应固定样本已有；该任务不是待提取的成功报告，不盲目重发。
2. 在接力账户新建合成公开研究任务，实际选择研究工具 chip；录下澄清、计划确认、执行和完成。保留 chip，用插入文本方式避免 `fill` 清除工具选择。
3. 确认报告属于本轮用户消息。按原生工具当前能力读取对应 iframe 或网页官方展开/导出/复制结果，完整保存章节和引用；不能用“最后一个 iframe”或旧报告猜测。
4. 若当前原生工具无跨域报告访问能力，报告 partial 和具体限制，保留页面交接；不要读 cookies/内部 token 或调用后台未授权接口。
5. 同时验证错误页、进度占位、旧报告、正文截断、引用缺失均不能完成；补充由真实页面脱敏得到的固定样本。

完成产物：真实模式证据、当前轮次对应关系、完整 `response.md`、引用、receipt；至少一条澄清/计划路径若网页实际触发。若不触发可另记未覆盖，不伪造。

## 6. 实施包 C：图像原图、编辑及批次

涉及 `skills/web-image`、`Jobs.artifact/observe`、`image-size` 校验和原生下载接口。

原机器已生成一张 1254×1254 的立方体/橙点合成图并目视确认。下载事件超时、原生 `downloadMedia` 报 blob 不受支持；没有原文件，任务保持 partial。用户接受这轮生成成功，所以先完成 A/B，不继续为旧图阻塞交接。

最终产品验收仍需：原生导出并打开原图，参考图上传后同会话编辑，至少一批多图与缺图/重复图拒收。只采用当前原生浏览器支持的下载/文件选择能力；不以截图、缩略图或模型 API 生成替代。无法导出时可由使用者手动下载已授权原图，并提供路径进行 import，但必须标注该人机交接，不能声称自动导出已完成。

现有文件校验检查魔数/尺寸/哈希，未做完整像素解码。用实际查看器验证可打开；若自动交付要求更强，再补充完整解码和损坏文件测试。修改依赖时更新锁与第三方声明。

## 7. 实施包 D：可选完整网页 Pro agent

依赖 A 的账户核查；有独立浏览器登录及平台授权后继续。严格按 `docs/runtime.md` 操作。

基线：`miuuyy/codex-chatgpt-web@f137c2f84da5df214c1e228d74f5ff43e7641c48`，Bun 1.4.0，官方 tunnel-client 上游实际锁定 v0.0.16。参考 Enhanced fork 为 `de76195c82a33fa70ec1cb60a277fe55b0332664`。所选上游已有 30 分钟保留会话和 compaction，因此 `runtime/patches` 当前没有源码补丁；不要宣称完整移植 fork。

按 `runtime prepare → launcher → configure → doctor → exec` 执行；JSON 模板见运行时文档。正常配置保留会话，Bigger Context 关闭；两者不得同时启用。主配置不改动；独立 codex-home 如需认证，通过正常登录，不复制 auth 文件。

实际授权需求：独立嵌入浏览器登录；账户 Developer Mode/MCP 权限；官方 tunnel ID 与 Read+Use runtime key 文件；网页连接器授权。配置只存 key 路径，不将 key 内容打印或入库。外部 provider/protocol 不兼容时显式报告，不能自动切兼容协议或覆盖用户路由。

验收任务用隔离合成仓库，要求模型读取源码/测试、修改一个实际缺陷、终端执行测试、解释结果；随后补充一轮失败反馈并再修复。核对 `runtime/runs` JSONL 中真实工具事件、Git diff 和测试输出。工具权限仍由 Codex 审批/沙箱管控，网页普通文本不能作为可执行调用。

再验证 retained 续接、compaction、中断/重启；未知是否执行过的写操作不得 replay。`runtime-operation.lock` 遗留时先核查 PID、事务和运行记录，不能盲删后重跑 setup/exec。离线测试通过不能代替这一套真实链路。

## 8. 实施包 E：恢复、回滚与最终交付

| 场景 | 已有证据 | 还需真实验收 |
|---|---|---|
| 长任务 | 注入时钟 >1 小时、真实 CLI 进程退出重启 | 网页实际 >1 小时/断连；同会话续查，不重复发送 |
| 并发与隔离 | 8 个 OS 进程、标签页/仓库/令牌/路径自动测试 | 两个网页任务分离且第三任务排队；恢复不抢占别人会话 |
| 取消 | cancel_requested/confirmed 状态测试 | 网页 Stop 的实际反馈；未证实停止时不释放写入所有权 |
| 插件安装卸载 | 独立 CLI marketplace 安装、19 工具冷启动和卸载保留用户字段 | 当前桌面端技能及 MCP 可用性 |
| 完整 runtime 回滚 | 上游 journal 测试与 wrapper 配置拒绝路径 | 真实 setup 后增加用户字段再 rollback；保留原模型/审批/沙箱/多 agent 和后来修改 |
| 无权限账户 | 已见 Plus 无 Pro、IAB 未登录 | 错误清晰，无静默 API/模型回退 |

若环境无可控网络断开接口，使用有授权的进程退出/重启与工具连接故障模拟，标注范围，不改系统网络安全设置。真实长任务等待应保持合理进度沟通，不默认创建定时任务。

收尾更新 `docs/acceptance.md`，每项列日期、版本/commit、浏览器/工具版本、实际可见模型、成功/失败/未覆盖、脱敏证据路径。`docs/reference-projects.md` 必须继续区分设计借鉴/代码移植/运行时依赖；新增移植补全许可证及固定 SHA。

执行 `npm run check`、`npm run package`；用新目录解压源码并 `npm ci`/检查，用无 node_modules 的插件 bundle 验证 MCP 冷启动。相同候选通过后不无目的重复全量测试。产物包括 marketplace 插件包、源码包、SHA256SUMS、中文说明和真实验收报告。版本状态必须匹配证据；仍有未验收能力就保持验证版。

## 9. 权限、记录与反馈

代码实现、测试、修复、更新交接文档在本任务范围。新平台账号的登录/连接器授权按平台要求交接给实际使用者。对外公开、邀请协作者、消息通知和付费动作不能从本计划推导出额外授权。

不要提交 `CWC_HOME`、profiles、cookies、auth.json、nonce、snapshot capability、tunnel key 或原始私人会话。仅提交合成测试、脱敏日志和必要页面样本；浏览器生成的账户截图先确认无私人内容。仓库 `.gitignore` 只是一层防误提交，不能替代逐个检查。

遇到真实权限阻塞，仅暂停受影响的包，继续独立本地工作。遇到产品范围变化报告事实和决定点；常规页面适配与局部修复自行完成。不得将当前未完成工作包装成“只需登录即可全部完成”。

最终回报应包括：实际改动路径、运行命令与结果、真实网页验证证据、偏离计划的理由、尚未验证部分、回滚/恢复说明。启动提示见根目录 `HANDOFF.md`。
