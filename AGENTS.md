# 项目协作入口

## 1. 目标与边界

交付一个原生 DSH bundle，新增独立 IELTS Academic 写作预设。保持先评分与分析、收到明确修改要求后才改写的教学流程。评分是模型教学估计，不是官方考官成绩。

## 2. 项目地图

- `README.md`：安装、使用、兼容范围和来源。
- `skills/ielts-writing-coach/SKILL.md`：唯一手工维护的批改规则。
- `prompts/ielts-writing-coach.md`、`cordis.patch.yml`：由构建脚本生成，不直接编辑。
- `scripts/`：开发构建和实际 DSH 宿主验收，不在插件安装时执行。
- `docs/verification.md`：版本、真实验证与未验证范围的当前入口。

## 3. 开发与验证命令

在仓库根目录执行 `npm run build` 生成文件，`npm run check` 检查生成文件是否与源一致。`npm run test:host` 的宿主前提见 README。分发包用 `npm pack --ignore-scripts` 生成，不添加安装生命周期脚本。

## 4. 协作约定

只修改这个插件的配置与资料；不修改用户 profile、默认预设、模型或凭据。不得提交个人绝对路径、会话导出、凭据、真实学生作文或未获公开许可的数据。外部评分文件只链接，不复制全文。公共入口由集成负责人维护。

## 5. 当前工作入口

目标、已验证、未完成与下一步统一维护在 `docs/verification.md`。发布前核对 `engines.dsh` 与实际通过的宿主版本，不用放宽版本保护替代验证。
