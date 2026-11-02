# 雅思写作教练 · DSH 插件

给 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai/deepseek-harness) 增加一个独立的 **「雅思写作教练」Agent 预设**。默认 IELTS Academic，目标 7.5–8 分，中文讲解、英文示例。

**先评原稿，再审题分析；你说「开始修改」后，才改全文。**

- **Task 1：**核对图表、关键特征、overview、数据遗漏、比较与单位；支持数据图、表格、多图、流程图和地图。
- **Task 2：**拆解题目要求，检查立场和论证，提供简单但充分的逻辑链、贴题例子和可迁移语料。
- **四项反馈：**TA／TR、CC、LR、GRA 分别给教学估分、原稿证据及下一档差距。
- **表达建议：**解释哪些场景适合 `counterpart`、`only a negligible amount` 等表达，不把生僻词当成自动加分项。

教学理念借鉴 Simon Corcoran 公开强调的清晰、简洁、连贯。本项目为独立社区作品，与 IELTS、Simon 或 DeepSeek 官方没有隶属或认证关系。

## 安装

当前 **v0.1.1** 已在 **DSH 0.2.0-rc.2** 与 **DSH 0.2.1-rc.5**、Node.js 22.22+ 上通过原生宿主检查。包内 `engines.dsh` 与 DSH peer 都只接受这两个已验证版本；其他版本尚未验收，不建议绕过兼容检查。先执行 `dsh --version` 确认。

DSH 0.2.1-rc.5 只按 `engines.dsh` 决定兼容性，并忽略 peer；0.2.0-rc.2 只检查 peer。两个字段写成同一个范围，因此任一安装器都只放行已验证版本。v0.1.0 仍钉在 0.2.0-rc.2，不要用它安装 0.2.1-rc.5。

Web profile：

```bash
dsh plugin --profile web add "https://github.com/7827666/dsh-ielts-writing-coach/releases/download/v0.1.1/dsh-ielts-writing-coach-0.1.1.tgz"
```

Desktop profile：

```bash
dsh plugin --profile desktop add "https://github.com/7827666/dsh-ielts-writing-coach/releases/download/v0.1.1/dsh-ielts-writing-coach-0.1.1.tgz"
```

使用其他已有 profile 时，把 profile 名换成实际名称。安装前保存当前任务，按 DSH 的提示关闭／重启使用同一 profile 的服务。无需本项目构建脚本或额外 API key。

安装后新建会话，在 Agent 预设中选择 **「雅思写作教练」**，再选择自己已配置的模型。插件新增独立预设，不自动切换默认预设或默认模型。旧会话仍沿用创建时的预设，请用新会话测试。

### 复制给 Agent 安装

```text
请按这个仓库的 README 安装 DSH 雅思写作教练插件：
https://github.com/7827666/dsh-ielts-writing-coach

先核对 DSH 版本与我实际使用的 profile。当前已验证兼容的 Release 是 v0.1.1，对应 DSH 0.2.0-rc.2 与 0.2.1-rc.5；Desktop 使用 profile desktop。只安装这个已验证 Release，不绕过版本检查，不为安装这个插件擅自升级或降级 DSH。不要安装只兼容 0.2.0-rc.2 的 v0.1.0。
保留现有配置、默认预设、模型和凭据；修改前备份涉及的配置，避免中断正在运行的任务。
安装后检查新会话能选择“雅思写作教练”，并说明选用的模型是否支持图片。
使用自编短文确认先评分与分析；发送“开始修改”后才改全文。不要上传私人作文作为公开测试资料。
最后告诉我安装位置、版本、实际验收结果和下一次使用方式。
```

## 每篇作文怎么提交

```text
请按预设批改，本轮只评分和分析。

类型：Academic Task 1 / Task 2
题目：[完整题目]
图表：[Task 1 附清晰完整原图，或完整数据转录]
我的原文：
[保留原文错误与分段]

用时：[可选]
特别想知道：[可选]
```

第一轮会依次给出：原稿评分、题目分析、内容诊断、数据分组或逻辑链、语料与表达建议、优先练习。此时不会代写完整英文 overview、主体段或全文。

准备好后发送：

```text
开始修改。保留我成立的观点和表达，先解释关键修改，再给完整稿。
```

也可以说 `继续分析第二段，不要改写`、`只修改第 3 段`，或提交自己的重写稿要求复评。每篇新作文重新从第一阶段开始。

Task 1 图片能否直接识别取决于所选模型和提供商是否支持图像输入。仅支持文本的模型请提供题干、标题、图例、单位、年份和完整数据转录。缺图时只能做部分评估，插件不会把猜测的数据当成原图。

## 在其他模型中使用

不使用 DSH，也可以把 [独立提示词](prompts/ielts-writing-coach.md) 全文复制到网页版模型。支持 Skill 的 Agent 可使用 [SKILL.md](skills/ielts-writing-coach/SKILL.md)。三种形式来自同一个规则源文件，流程一致。

## 工作方式与数据

这是一个原生 **配置 bundle**，安装时只声明一个 Agent 预设；没有自定义运行时 JavaScript、模型服务或独立后台。预设包含完整教练提示词、DSH 原生 `web_search`／`web_fetch` 工具，以及原生长对话压缩组件。联网需要你已有的 Web provider；没有 provider 时仍可按离线教学估分方式使用。

这个预设只主动注册两项联网工具，不启用 shell、文件写入、子代理或插件管理工具，也不会扫描你的项目。实际工具列表仍可能受到宿主其他全局插件的影响；它不是沙箱或权限管理器。完整的教练 persona 用于该会话，不自动拼入代码项目的工作目录指令；全局与其他预设保持各自的配置。

插件本身不添加遥测、作文库、账户或凭据存储。作文仍会发送给你在 DSH 中选择的模型提供商；聊天记录按 DSH 的设置保存。模型调用、联网和压缩产生的费用及数据处理方式沿用这些服务。完整提示词会增加模型输入长度。

两阶段顺序是**模型指令约定**，不是代码拦截器。实际遵循程度、图片识别和估分会随模型而变化。分数是基于官方标准的教学估计，不能保证和真实考官一致；AI 修改稿也不代表学习者已经掌握该水平。

## 卸载

```bash
dsh plugin --profile web remove dsh-ielts-writing-coach
```

按 DSH 的提示重启，再为新会话选择其他预设。本插件没有独立的学习数据库可删除；已有会话记录由 DSH 管理。

## 开发与验证

本项目无需构建依赖，也没有 `prepare`、`postinstall` 等安装脚本。只修改 `skills/ielts-writing-coach/SKILL.md` 中的教学规则，然后运行：

```bash
npm run build
npm run check
```

构建生成独立提示词及 `cordis.patch.yml`。`--check` 检查二者是否仍与源文件一致；修改后别忘记提交生成文件。

真实宿主验收需要已安装的 DSH **0.2.0-rc.2** 或 **0.2.1-rc.5**。将 `DSH_TEST_ANCHOR` 指向该安装的 `@deepseek-ai/dsh/package.json`，然后执行 `npm run test:host`。例如标准 npm 全局安装时：

```bash
DSH_TEST_ANCHOR="$(npm root -g)/@deepseek-ai/dsh/package.json" npm run test:host
```

特殊安装位置请使用实际路径。Windows 可先用 PowerShell 设置 `$env:DSH_TEST_ANCHOR`，再运行同一 npm 命令；Windows 尚未现场验收。

测试使用真实的 Cordis Loader、预设注册、工具、SystemPrompt 和压缩服务，在独立内存宿主中运行；没有模型 adapter 或联网 provider，不读取用户 profile、不发送模型请求。它验证注册、提示词装配、隔离和卸载，不能替代真实模型和浏览器验收。详见 [验证状态](docs/verification.md)。

打包：

```bash
npm pack --ignore-scripts
```

分发包只包含 package.json、原生 patch、提示词、Skill、README 和 LICENSE。GitHub Release 同时提供 SHA-256 校验文件。开发脚本不进入安装包。源码安装可使用 `dsh plugin --profile web add .`，但普通用户优先使用固定版本 Release。

## 评分与教学来源

来源核对日期：2026-11-02。核实到的 IELTS 写作描述符标注 **Updated May 2023**；中文摘要不替代官方完整文件。联网可用时教练会核对官方描述符，离线时标明使用已有知识估分。

- [IELTS Writing Band Descriptors](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf)
- [IELTS Writing Key Assessment Criteria](https://ielts.org/cdn/ielts-guides/ielts-writing-key-assessment-criteria.pdf)
- [IELTS scoring in detail](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail)
- [IELTS Academic Writing format](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing)
- [Simon — What’s your style?](https://ielts-simon.study/ielts-writing-whats-your-style/)
- [Cambridge — counterpart](https://dictionary.cambridge.org/dictionary/english/counterpart)、[Cambridge — negligible](https://dictionary.cambridge.org/dictionary/english/negligible)
- [DSH Agent preset 官方说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/README.md)、[DSH 插件管理器](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/README.md)

本仓库的原创代码与提示词采用 [MIT License](LICENSE)。外链评分文档、词典和课程内容不属于本仓库授权范围；本项目不包含这些材料的全文、付费课或 Simon 范文。
