# Phase 3.2 交接文档

## 项目背景

这是 TOMS ISV Console 的 Phase 3 阶段。核心产品模型：
- **Company** 是业务主体，可同时持有 ISV / ISO 契约
- **ISV** = 上传应用到自己的"app pool"
- **ISO** = 从其他 ISV 池里订阅应用 → 推送到自己的 merchants/terminals
- 一个 Operator 可属于多个 Company，通过侧边栏顶部 tenant switcher 切换

测试 tenants：
- `acme-sw` — Acme Software（纯 ISV）
- `northbay` — Northbay Devices（纯 ISO）
- `summit` — Summit Retail Co.（ISV + ISO 双契约）

---

## Phase 3.2 范围

### 已完成 ✅

**1. Pull 流程（订阅 ISV 新版本）** — 全屏 5 步向导（不是弹窗）
- 文件：`pull-wizard.jsx`
- 路由：`route.screen === "pullWizard"` + `route.versionId` + `route.rolloutOnly`
- 5 步：Review release · Audience · Rollout · Upgrade options · Confirm
- Step 1 footer 三个动作：
  - `Reject this version`（红色 danger 按钮 + confirm，标记 skipped）
  - `Pull only — skip rollout`（拉取但不发布）
  - `Continue to rollout setup`（继续走完 5 步）
- Step 2/3/4 footer 也有 "Pull only" 出口
- Step 1 含完整漏洞 findings 列表（critical/high 默认展开）

**2. Rollout 流程（已 pull 版本发布到 merchants）** — 同一 wizard 的 rollout-only 模式
- 通过 `route.rolloutOnly = true` 触发
- 隐藏 Step 1（Review），从 Audience 开始
- 头部显示"Roll out"而不是"Pull update"
- 没有 Pull only 出口，只有 Cancel
- 入口：
  - 订阅应用 Overview 的 Subscription 卡：On latest 时显示 "Roll out" 按钮
  - Version Detail：当前订阅版本 + status="published" 时显示 "Roll out" 按钮

**3. Audience step 改造**
- 顶部"Already on this version"块（rollout-only 模式始终展示）
- 4 个 mode：All / Whitelist / Blacklist
- 搜索 + 翻页（8/页）
- 点击行任意位置 toggle 选中
- 底部可折叠"Selected merchants"抽屉：列表式展示 + Clear all 按钮 + 10/页翻页
- **不能降级规则**：默认隐藏当前版本号高于目标的 merchants；"Show downgrades" 开关打开后显示

**4. 版本拒绝（Scenario 1）**
- 数据：`VERSION_REJECTIONS = { "tenant:app" → Map<versionId, "skipped"|"blocked"> }`
- 在 Versions tab 每行 Status 列显示：
  - 自己上传的应用：原 lifecycle status pill
  - 订阅应用：Subscribed / Available / Blocked / Skipped / Unavailable
- 行末按钮按 reject 状态切换：Pull + Skip + Block 三键 / Re-consider + Block / Unblock
- `latestPullableVersion()` 自动跳过 blocked/skipped
- KPI "Updates available" 自动联动

**5. 应用池统一视图（PoolAppsList）**
- 单一表格，"Publisher" 列区分自有 vs 订阅
- KPI 卡可点击 toggle 过滤（Published / Drafts → status filter；Subscribed / Updates → kind filter）
- 筛选 chips 去掉所有计数
- "Add to pool" 按钮 → 双契约 tenant 弹 modal 选 Register / Subscribe；单契约直进对应流程

**6. App 详情自有 vs 订阅差异化**
- 自有应用：Tabs = Overview / Versions / Subscribers / Compatibility / Settings
- 订阅应用：Tabs = Overview / Versions / Deployments / Compatibility（无 Subscribers / Settings）
- Header actions 按所有者切换：Edit + Upload version / Unsubscribe + Pull
- Overview 卡片内容差异化（订阅版有 Subscription 卡 + Vulnerability scan 卡 + Compatibility 简要）
- 顶部漏洞 spotlight banner（dirty / rejected / incomplete 时显示）
- Publisher 信息在 Overview 的 About 卡内（不在 header）

**7. Deployments tab（订阅应用 + Merchants 合并）**
- 完整商户级 rollout 视图
- KPI 卡：Merchants covered / Total terminals / On latest / Behind（可点击 toggle 过滤）
- 搜索 + 版本筛选下拉
- 行展开：每个终端 SN + 版本 + 状态（installed / pending / failed）
- 行末"Catch up"按钮（Phase 3.4 stub）

**8. Version Detail 页**
- 订阅应用查看时，header 加 "Roll out" 按钮（仅 currentSnapshot + published 时）
- 自有应用 "Roll back" 按钮加 confirm 流程（mock）
- Subscribers 卡分页（10/页，<10 不显示翻页）
- 移除 "Re-scan" 按钮

### 未完成 ❌（下一轮做）

**A. Version Detail 加 "Merchants on this version" 卡**
- 订阅视角的版本详情页右栏当前有 Reach / Compatibility 卡
- 加一张新卡列出 ROLLOUT_HISTORY 里此版本对应的商户（仅当前 tenant 的）
- 顶部 "Roll out to more merchants" 按钮 → Rollout wizard

**B. ROLLOUT_HISTORY 持久化**
- 当前 wizard 走完只 mock 更新 `subscribedVersionId`，没真正调用 `recordRollout(tenantId, appId, versionId, merchantIds)`
- app.jsx `onConfirm` handler 需要补：rollout 完成时调用 `recordRollout(...)` 写入 ROLLOUT_HISTORY，这样 Deployments tab 能看到这次的 rollout 结果

**C. Block 后从 Pull 入口的处理**
- 当前订阅卡的 Pull 按钮、Versions tab 的 Pull 按钮已经在 `canPullThis` 里检查了 rejection
- 但 PullWizardScreen 入口本身（被路由直接打开）没拦截 — 如果用户绕过 UI 直接进入 wizard，Block 的版本还能走完流程
- 需要在 wizard 入口加 guard

**D. ISV 视角的"哪些 ISO 订阅了我的应用"按版本看**
- 当前 Version Detail 的 Subscribers 卡显示所有 `subscriberIds`，没区分订阅到哪个版本
- 应该按"该 ISO 当前订阅的版本"来过滤
- 这块是 ISV 视角的数据可见性问题，可能不在 3.2 范围

---

## 关键数据结构（都在 data.jsx）

```js
// 应用池：每个 app 有 publisherTenantId 区分自有/他人
APPS[i].publisherTenantId  // "acme-sw" | "summit"

// ISO 订阅：哪些应用 + 当前订阅版本
SUBSCRIBED_APPS = {
  "northbay": [{ appId, subscribedVersionId, subscribedAt, deployedTerminals }, ...],
  "summit":   [...],
}

// ISO 旗下 merchants
MERCHANT_FLEETS = { "northbay": [{ id, name, region, terminals }, ...], ... }
merchantsConfiguredForApp(tenantId, appId)  // 哪些 merchants 装了这个应用（确定性 hash）

// Rollout 历史
ROLLOUT_HISTORY = { "tenant:app:version" → Set<merchantId> }
recordRollout(tenantId, appId, versionId, merchantIds)
merchantsAlreadyOnVersion(tenantId, appId, versionId)

// 版本级拒绝
VERSION_REJECTIONS = { "tenant:app" → Map<versionId, "skipped"|"blocked"> }
getRejectionState / setRejectionState / latestPullableVersion

// Deployment 状态查询
getMerchantCurrentVersion(tenantId, appId, merchantId)  // 该 merchant 当前在哪个版本（最高的 rollout 含它）
getAppDeploymentState(tenantId, appId)                  // 全部 merchants + 版本 + 终端列表（mock）

// 版本比较
compareVersions(a, b)  // 按 version.code 数字比较

// 灰度发布默认曲线
ROLLOUT_DEFAULT_CURVE = [{ day:1, pct:1 }, ..., { day:7, pct:100 }]
```

---

## 文件结构

| 文件 | 角色 |
|---|---|
| `Carbon ISV Console.html` | HTML 入口 + 字体 + 全局 CSS + 脚本顺序 |
| `tweaks-panel.jsx` | 设计 tweak 面板（保留） |
| `data.jsx` | 所有 mock 数据 + helpers + AppIcon + Screenshots 组件 |
| `shell.jsx` | Sidebar / TopBar / PageHeader / Button / Card / Badge / Modal / Drawer / Toast / Pagination / TenantSwitcher / `useActiveTenant` hook |
| `screens.jsx` | AppsListScreen / PoolAppsList / AppDetailScreen / AppOverview / SubscribedAppOverview / AppVersions / AppSubscribers / SubscribedDeployments / AppDevices / AppSettings / VersionDetailScreen / VersionSubscribersCard / PermissionsModal |
| `subscribed.jsx` | resolveSubscription helper + 已废弃的 SubscribedAppsView（向后兼容保留） |
| `modals.jsx` | AppFormScreen（新建/编辑应用） |
| `wizard.jsx` | PublishWizardScreen（ISV 上传新版本） |
| `pull-wizard.jsx` | PullWizardScreen（ISO 拉取版本 + rollout-only 模式） |
| `app.jsx` | 顶层路由 + Tweaks 面板配置 |

**脚本加载顺序**（重要！HTML 里）：
```
react → react-dom → babel → tweaks-panel → data → shell → screens → subscribed → modals → wizard → pull-wizard → app
```

---

## 实施剩余 4 项的建议顺序

1. **B. ROLLOUT_HISTORY 持久化** — 5 分钟改动，让 Scenario 2 的演示链条闭环
2. **A. Version Detail "Merchants on this version" 卡** — 中等
3. **C. Block guard** — 小
4. **D. ISV 视角按版本看订阅者** — 暂时不做，等 Phase 3.3 再说

---

## 已知技术债 / 后续考虑

1. `pull-wizard.jsx` 的 `next` 解析逻辑有 hack（混合 `version || ...` 的奇怪 ternary），逻辑可读性差，建议重构
2. `resolveSubscription` 依赖 `window.__activeTenant` 全局状态，应该改成显式 tenant 参数
3. `MERCHANT_FLEETS` 和 `merchantsConfiguredForApp` 用确定性 hash 决定哪些 merchant 装哪些 app，演示足够但不真实
4. Mock 数据是写死在 data.jsx，所有改动（rollout / pull / reject）都直接 mutate 全局对象再 force-render；React 严格意义上 anti-pattern，但演示场景下足够。生产前要换成正常的状态管理
5. 一些 Pagination 复用了 shell 的 `Pagination`，一些直接手写翻页（subscribed drawer / wizard audience picker）—— 应该统一

---

