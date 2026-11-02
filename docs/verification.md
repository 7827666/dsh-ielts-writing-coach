# 验证状态

验证日期：2026-11-02。版本：插件 v0.1.1；DSH 0.2.0-rc.2 与 0.2.1-rc.5；Node.js 22.22.3；macOS。

目标为可安装的原生 Agent 预设 bundle。仅新增 `ielts-writing-coach`，完整批改规则由唯一 Skill 源生成。

## 已完成

| 检查 | 观察到的结果 | 可复查方法 |
|---|---|---|
| 生成文件一致性 | 7247 字符提示词与 Skill 正文一致；YAML 的 persona 前缀保留全文 | `npm run check`；宿主测试再次比较实际 YAML 与独立提示词 |
| 原生加载 | 两个已验证 DSH 版本都由真实 Cordis Loader 读取 patch，预设 roster 无 broken；persona、web、compaction、command-compact 均 ACTIVE | 分别把 `DSH_TEST_ANCHOR` 指向 0.2.0-rc.2 与 0.2.1-rc.5 后执行 `npm run test:host` |
| 提示词与工具装配 | 该 scope 渲染为完整教练提示词；动态运行环境片段被抑制；注册 web_fetch / web_search | 同上 |
| 隔离与卸载 | 测试宿主的全局 persona、默认 ID 与基线预设保持原值；释放 lease 和移除声明后清理完成 | 同上 |
| 兼容保护 | `engines.dsh` 与五个 DSH peer 都是 `0.2.0-rc.2 \|\| 0.2.1-rc.5`。0.2.0-rc.2 只检查 peer，0.2.1-rc.5 只检查 `engines.dsh`；两个运行时的官方检查都接受本包，并拒绝未验证的 0.2.1-rc.4。未授予豁免 | 宿主测试调用对应版本的 `evaluatePluginCompatibility` |
| 预设包接口 | 预设、persona、web、compaction-basic、command-compact 的已发布 `lib/index.js` 在两个 DSH 版本间内容相同。0.2.1-rc.5 移除了测试用的 `livePresetMounts` 导出，bundle 声明不依赖它 | 对照两个安装的包；0.2.1 宿主测试改用 composition inventory |
| CLI 安装与移除 | 在两个独立空白 DSH_HOME 中，0.2.0-rc.2 与 0.2.1-rc.5 的官方 add 都安装本地 tgz 并启用 bundle；0.2.1-rc.5 安装后的文件再次通过宿主测试；两边的官方 remove 都移除依赖与 bundle 条目 | `dsh plugin --profile <隔离profile> add <tgz>` / `remove dsh-ielts-writing-coach` |
| 分发内容 | 安装包仅含 manifest、原生 patch、提示词、Skill、README、LICENSE；无运行时 JS、安装脚本或私人数据 | `npm pack --ignore-scripts --json`；检查 tar 清单 |
| 发布审查 | 独立只读审查未发现 P1/P2 阻断；核对了格式、版本保护、公开数据范围和说明边界 | 仓库源码与本文 |

宿主测试使用真实 Loader、SystemPrompt、Tools、Web、LLM、Session、TokenMeter、Commands 等服务。会话存储只在内存中，没有模型 adapter、凭据源或 Web provider；测试禁止 fetch，观察到 0 次网络尝试。没有替代这些服务的 mock。

在转换为插件之前，提示词用自编文字材料试跑了 Task 1、Task 2、缺图、“继续分析”和“开始修改”。这些样例观察到了预期的分阶段行为；它们不是 DSH 内真实模型链路的验收，也没有与真人考官校准分数。

## 未验证的范围

- DSH 中的真实模型批改、图片识别、网页搜索／抓取以及真实压缩摘要。
- 浏览器界面、Desktop 图形界面、Windows，以及 0.2.0-rc.2 / 0.2.1-rc.5 以外的 DSH 版本。0.2.1-rc.5 只完成了独立内存宿主与隔离 CLI 安装检查，没有在朋友的 Desktop 会话里点选预设。
- 用户正在使用的 profile 安装、已有会话恢复或卸载后的旧会话行为。

v0.1.1 不存在已知的本地发布阻断。扩展到更多 DSH 版本时，先在对应版本复跑原生宿主与隔离安装检查，再把该精确版本加入 `engines.dsh` 和 peer 范围；不要用宽范围代替验证。模型或界面验收另记真实结果。仓库和发行包地址、资产与校验值以 GitHub Release 为准。
