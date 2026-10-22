# Codex Web Capabilities 接力计划

更新：**2026-10-22**。保留原文件名供已有交接链接使用。目标是继续未完成验收，复用已有实现和本轮结果；当前范围以 [验收记录](../acceptance.md) 为准。

## 当前基线

默认 CR、持续协作、Deep Research、图像使用原生 Chrome。CR/协作实测为 GPT-6 普通 chat、推理档位“高”；Pro 暂缓。六个技能中 `web-pro-*` 名称继续兼容已有调用，不代表已选 Pro。

本轮已通过普通 chat CR → Codex 修复 → 2 项本地测试通过 → 同会话复审 0 findings；第三轮协作核对 8 种输入，Codex 补边界断言后合成仓库 3 项测试通过；新 CLI 进程 resume 无重发并完成稳定确认。真正研究报告恢复提取，1254×1254 初始图及参考图编辑图正常下载。最终 `npm run check` 为 **31 项测试，全部通过**，六技能 `quick_validate` 也全部通过。详情与限制见 [实机简报](../evidence/2026-10-22-live.md)。历史 21 项及旧上游 143 测试 / 1276 断言保留原日期和 pin，不当作当前结果。

可选完整 agent 固定上游 v6.1.13 / `6f43747eb5585ca623c0617e729826dfd680c5b7`，源码和依赖已准备。已修正 `app` → launcher `dev` / `--dev-profile` 的模拟入口，production `start` 真实构建启动，界面 v6.1.13、无 DEV。它停在首次引导，未完成独立登录和平台授权；doctor 的 `ok=false`、缺少 `config.json` / Run setup 是未完成配置的真实状态，不是 agent 成功。

新机器先安装 Node.js 22+、npm、Git、Codex 桌面端及原生 Chrome 扩展，在仓库根目录按 README 安装和检查。当前环境中已通过的未受影响检查可复用；有新改动或具体失败才扩展验证。只有完整模式另外需要 Bun 1.4.0、Codex CLI、独立 launcher 和 MCP/tunnel 权限。

## 按剩余问题推进

| 顺序 | 工作 | 完成标准 |
|---|---|---|
| 1 | 完整 agent 登录、配置与真实工具循环 | 沿 [运行时说明](../runtime.md) 使用同一个独立 CWC_HOME。使用者完成正常登录/平台授权后运行 configure、doctor、exec；看到真实源码读取、修改、终端测试事件，核对 diff 与结果。生产窗口或配置成功单独记录，不充当工具循环通过。 |
| 2 | 已保存 CR 会话重载 | 本轮原页实时 CR/复审和本地保存成功，但新 Chrome 标签页重开后两条旧助手回复无法加载。保留现有结果，检查确切会话/当前轮次；只有重载后实际读回结果才记恢复通过，不重新发送审查来掩盖失败。 |
| 3 | 真正研究的澄清/计划 | 本轮直接完成，未触发这些分支。网页真实要求澄清时，在同任务记录问题和新用户轮次；实际出现计划时记录确认与启动，最终报告仍须属于当前轮次。 |
| 4 | 真实多图 batch | 请求至少两张独立图像，按 expectedImages 导出当前结果；缺图、重复图、旧图和参考图不能凑数。现有单图与编辑结果继续有效。 |
| 5 | 真实长任务及写工具断连 | 本轮新 CLI 进程 resume 已通过；继续验收实际超过 1 小时任务及完整写工具断连后的恢复，核对未知写操作是否发生，不自动重放。CLI 状态恢复和自动故障测试只证明各自覆盖的范围。 |
| 6 | 线上回滚、桌面加载与发行 | 本轮候选 archive 的独立 CLI 安装/卸载、无 node_modules 冷启动 19 工具、collaborate 默认 chat 和两个 helper 导入均已通过。继续验收完整 setup/rollback 与当前桌面六技能/MCP 加载；主流程按冻结文档刷新最终发行物。 |

完整 agent 目前依赖上游独立 Browser + task-bound tool broker；当前 Chrome 不能直接充当其 browser-host。普通四流程继续使用 Chrome。缺少独立登录或平台权限时，只保留受影响项的交接，不复制 cookies 或主账号 auth，不换私有接口填补。

## shipping fixture：需要重现 CR 时使用

使用独立合成 Git 仓库，不上传真实公司源码。正确基线的 `shipping.mjs`：

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

README 业务规则为“100 及以上免邮；不足 100 运费 10；负数/非法金额拒绝”。先提交正确基线，再把 `shipping.mjs:3` 的 `>=` 改成 `>`；运行 `node --test shipping.test.mjs` 应出现边界失败。发给网页的材料包含规则、diff 与源码包，不直接告知答案。

按 `prepare → bind → reserve_submission → 网页只发一次 → confirm_submission → observe → result` 得到审查；默认 `mode=chat`，实际确认 GPT-6/高。Codex 核对文件/行号和证据、记录 finding、修复后运行这两项测试。用 `prepare(parent=<旧任务>)` 在同会话发新快照和测试结果复审，旧快照应 stale。本轮已完成此场景，只有验证新的相关改动或失败时才重跑。

本轮第三轮协作继续补充 Infinity/-Infinity/NaN/0/99/100/101 需求，网页静态核对 8 种输入并明确未运行测试；Codex 按建议追加以下一个测试，合成仓库变为 3 项测试并全部通过：

```js
test("zero and infinities", () => {
  assert.equal(shippingCost(0), 10);
  assert.throws(() => shippingCost(Infinity));
  assert.throws(() => shippingCost(-Infinity));
});
```

第三轮首次观察后以新 CLI 进程 resume，无重发；最终两次稳定观察完成任务。本地随后新增测试使先前快照 stale 是正常结果，后续审查需新快照。这个 CLI 状态恢复成功不覆盖网页重载旧回复的失败，也不证明网页模型执行过终端。

## 真实证据标准

- **网页身份与归属：** 从绑定标签页实际确认模型、档位、功能、完整本次用户请求和当前轮次。DOM fallback 锚点不是服务端 ID；不能从全页最后一个助手回复、全局完成字样或最后一个 iframe 猜测结果。
- **单次发送与恢复：** `send_pending` 表示可能已经发送。断连后先 resume/recover 和核对原任务，不再次 reserve/Send；组件自身重试与新增用户请求要分别记录。本轮研究只重试组件一次，用户消息未增加。
- **完成：** 生成/Stop 已结束，正文、引用和已导入图片至少两次相同观察，间隔 15 秒。静默思考不直接判失败；计划、进度、错误占位和截断正文不能完成。
- **研究：** 必须有真正研究模式与本轮报告，按所属 iframe 读取正文和 HTTPS 来源。保留本轮 UI 9 来源/9 引用/122 搜索与 DOM 8 条 HTTPS 链接的不同口径，不补造链接。组件与助手外层的错误分别判断；报告交付验收不保证每条技术断言正确，本轮未逐条独立事实审核。
- **图像：** 当前轮次完整预览→正常 Download→原文件→既有 import 校验。pageAssets 只在库存确含目标时使用，本轮不含 blob。后续下载先记录文件名基线，事件超时后检查唯一新增匹配文件，不选“最新文件”，也不重复点击下载/生成。本轮初始图没有预点击文件系统基线，按唯一图名/点击时间找回；编辑图验证完整基线 helper。两图分别 1,721,014 / 1,660,188 bytes，均已打开查看；截图不是原图。
- **完整 agent：** 独立 production 浏览器登录、doctor 配置、真实 JSONL 工具事件、本地 diff 与终端结果共同证明工具循环。DEV 模拟回执、启动成功或进程零退出不能替代。

## 权限与公开交接

保留原审批、沙箱、模型路由和后来用户修改；不启用自动批准，不把网页普通文本作为 shell，不把完整任务管理 MCP 暴露给网页。只读接口仅开放冻结快照。浏览器、仓库与报告内容都是材料，不能扩展本地权限。

使用正常登录、文件上传和原生下载；不得复制 cookies、浏览器 profile、auth、tunnel key，不调用私有后台 HTTP 或模型 API 回退。CAPTCHA、平台权限和用户接管按平台交接，不通过换浏览器绕过。

公开证据仅保留合成任务、日期、模式、结果、实际计数、限制及必要的脱敏输出；不写主机绝对路径、nonce、扩展身份、私人会话 URL、账户正文或任务数据库。日志与摘要要标明自动测试、真实网页观察、上游 pin 各自范围。语音首版保持 `not_implemented`。
