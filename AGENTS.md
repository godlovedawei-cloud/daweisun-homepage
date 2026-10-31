# daweisun.com 项目维护规则

维护基线：2026-10-31。开始任务先读 [Log.md](Log.md) 的最新变更和当前待办，再检查 Git 状态，区分已发布版本与本地草稿。
本文是唯一的项目维护规范；用户当前任务的明确要求优先于仓库约定，已授权事项直接推进。
文件名沿用 Codex 默认识别的 [AGENTS.md 约定](https://learn.chatgpt.com/docs/agent-configuration/agents-md)。

## 1. 项目与文档分工

- 网站：[daweisun.com](https://daweisun.com)，Dawei Sun 的英文个人学术主页，含论文页、公开 CV 和两个麻醉参考工具。
- 仓库：[godlovedawei-cloud/daweisun-homepage](https://github.com/godlovedawei-cloud/daweisun-homepage)。GitHub Pages 从 `main` 分支根目录发布，推送即可能触发上线。
- 页面使用静态 HTML/CSS/JavaScript；不需要前端框架或根目录 npm 构建。
- 访客统计使用独立 Cloudflare Worker 与 KV；兄弟目录 `Yanxiawei` 是独立网站，不能混用部署、存储或密钥。

| 文件 | 职责 |
| --- | --- |
| 本文件 | 代理读取入口、当前结构、长期约束和维护流程 |
| [Log.md](Log.md) | 重要变更、验证和发布状态、当前待办 |
| [README.md](README.md) | 简短项目入口与常用命令 |
| [内容依据与技术参考](docs/reference.md) | 从原 README 归档的来源、历史决定和详细技术说明 |
| `data/*review*.md` | 对应临床功能的核对依据、差异和待审问题 |

## 2. 代码入口与内容来源

| 子系统 | 维护入口与输出 |
| --- | --- |
| 学术主页、论文页 | 修改 `scripts/build_site.py`；生成 `index.html`、`publications.html`。不要只改生成后的 HTML |
| 论文数据 | `data/publications.json`；保留来源、作者角色和核验信息 |
| 临床经历汇总 | `data/clinical-experience.json` 与构建脚本中的已审阅文案 |
| 公开 CV | 构建脚本的 `build_cv()` → `assets/Dawei-Sun-CV.pdf`；网页与 PDF 存在有意保留的文案差异 |
| 公共样式与导航 | `assets/site.css`、`assets/navigation.js` |
| 成人麻醉工具 | `tools/anesthesia-dosing/`，计算逻辑在 `calculator.mjs`，界面、记录及离线管理在 `app.js` |
| 儿科麻醉工具 | `tools/pediatric-anesthesia/`；当前工作区另有未发布模块重构，先查日志和 Git 差异 |
| 离线版本构建 | `scripts/build_anesthesia_tool.py`；各工具自己的 `sw.js` 定义缓存资产及作用域 |
| 访客采集 | `assets/analytics.js`；四个页面共用 |
| 统计服务与后台 | `worker/src/index.js`、`worker/src/admin.js`；部署配置 `worker/wrangler.toml` |
| 网站元数据 | `CNAME`、`robots.txt`、`sitemap.xml`；页面增删时检查链接与 sitemap |

内容改动以已确认的用户资料为依据。不能根据日期自动把计划中的考试、见习或资质改成已完成。
保留 `SHOW_CLINICAL_VOLUMES = False`，除非用户明确要求恢复展示。详细个人履历与内容来源见 `docs/reference.md`，不在此重复。

## 3. 维护规则

- 直接、简洁；发现方案不合适时先指出问题并给出更稳妥的做法，再修改代码。
- 每种信息只保留一个权威入口；新增文档或命令层应承担独立职责。
- 开始先看 Git 状态和差异。按本次任务范围修改、提交和发布，不夹带现有草稿；不得用 `reset --hard`、`clean` 或覆盖文件来清理用户工作。
- 新功能使用独立功能分支（默认 `codex/` 前缀），生产维护保持独立；已有草稿由其所属任务整理，不擅自迁移、stash 或合并。提交前检查 `git diff --cached`，不要用 `git add .` 夹带其他修改。
- 大规模删除、不可逆清理或破坏性覆盖必须取得明确确认。普通修复与已授权发布不额外增加审批流程。
- 报错先提供并执行对应的日志查看命令，再定位原因。优先看失败命令报告的日志路径、Pages 构建错误、浏览器控制台及网络请求，不猜修复。
- GitHub Pages 会公开已提交的源文件和 Markdown。文档、测试与日志中都不得写入密钥、真实访客 IP、患者数据、私有 CV 或临床原始记录。
- 凭据由环境变量、Cloudflare Secrets 或被忽略的本地文件提供；不得写进源码、URL、提交或公共日志。
- HTTP 调用使用 30 秒超时和明确的重试上限；当前采集不重试、不排队补传。将来若增加 LLM 调用，必须设置最大 token 数，不默认引入 AI 运行依赖。
- 如任务涉及对象存储备份，默认使用 `rclone`；首次 sync/delete 必须加 `--dry-run`，排除 `.git/`、`node_modules/`、`__pycache__/`。

## 4. 构建、预览与验证

从仓库根目录运行命令；先判断改动涉及哪个子系统。

```sh
# 网页构建：保留现有公开 CV
python3 scripts/build_site.py --pages-only

# 只更新工具离线版本
python3 scripts/build_anesthesia_tool.py

# 本机预览；端口占用时换端口，不终止别人的服务
python3 -m http.server 4173 --bind 127.0.0.1
```

`--pages-only` 仍会构建两个工具的离线版本，检查由此产生的 `sw.js` 差异，避免把本地儿科草稿的缓存版本带入发布。
仅当任务包含更新 CV 时运行 `python3 scripts/build_site.py`；完整 CV 构建需要 ReportLab 和脚本指定的 macOS Arial 字体，并需检查 PDF 文本与渲染。
网页构建会为首页资产添加内容版本；工具资产或共享统计脚本变化后，需要重建离线缓存版本。

| 改动 | 相关验证 |
| --- | --- |
| 学术页面或导航 | 构建后检查桌面/手机布局、锚点、链接、CV 下载及生成文件差异 |
| 成人计算 | `node scripts/test_anesthesia.mjs` |
| 儿科参考 | `node scripts/test_pediatric_rr.mjs`、`node scripts/test_pediatric_reference.mjs`、`node scripts/test_pediatric_sevo.mjs` |
| 本地儿科剂量重构 | `node scripts/test-peds-doses.mjs`；此脚本属于当前未发布草稿，发布前核对其跟踪状态 |
| 访客统计 | `node scripts/test_analytics.mjs`；逻辑变化另查真实浏览器请求、计时、滚动及后台展示 |
| 离线或存储 | 检查离线重载、旧版本更新、更新失败保留旧缓存、成人/儿科记录隔离及原有记录保留 |
| 仅维护文档 | 检查路径、链接、事实及 `git diff --check`；不为文档改动重建 CV 或运行无关临床测试 |

新剂量、年龄边界、单位或计算规则变更必须有相应验证。临床来源核对不等于整体工具已获临床验证。
儿科工具保留 Test/Unverified 提示；不得擅自增加“已临床审核”等声明。

## 5. 本地记录与离线边界

- 成人记录键：`daweisun.anesthesia-dosing.patients.v1`；儿科记录键：`daweisun.pediatric-anesthesia.patients.v1`。
- 患者输入、标签、记录和计算结果只保存在浏览器，不得被统计脚本读取或上传。记录格式变化要考虑兼容，不能靠清空记录完成升级。
- 两个 service worker 的作用域、缓存前缀各自独立；清理只能针对自己拥有的缓存。
- 缓存安装保持原子性，失败保留旧版本。新增工具模块时，同时更新缓存清单与版本构建器的资产清单。
- 两个工具都缓存共享的 `/assets/analytics.js`。统计脚本变化会影响两个离线版本；已安装工具需要 Update 才切换到新缓存。
- 桌面浏览器模拟不能代替物理 iPhone Home Screen、锁屏和系统回收场景验证，交付时说明验证范围。

## 6. 访客统计的长期约定

后台：[私人访客记录](https://daweisun-visit-log.yanxiawei-visit-log.workers.dev/admin)。Worker：`daweisun-visit-log`，绑定 `VISIT_LOGS`。

| 项目 | 当前行为 |
| --- | --- |
| 自动采集 | 访客打开网页后自动运行；后台是否打开、是否刷新不影响访客端采集 |
| 采集范围 | 主页、论文页、成人工具页、儿科工具页 |
| 时长上报 | 约每 5 秒；滚动变化最多每秒上报一次 |
| 前台停留 | 页面可见且在线的时间，静静阅读也计时；隐藏、锁屏、离线期间暂停 |
| 活跃时间 | 最近 60 秒有操作的时间，与前台停留分开显示 |
| 滚动进度 | 按单次页面访问记录；顶部 0%、底部 100%，无需滚动的短页面为 0% |
| 聚合 | `metricsVersion: 2`，按页面访问 ID 取累计毫秒计数的最大值，避免重复或乱序上报重复加时 |
| 后台刷新 | 每 60 秒；需登录、页面在前台、未查看历史批次且无正在加载的请求。保留手动刷新 |
| 保留与显示 | KV 记录 90 天；后台北京时间；最新 500 条事件分页，汇总不代表完整 90 天历史 |
| 旧版数据 | 保留原始旧活跃时间及旧显示深度，明确标识，不能补算成新版时长或进度 |
| 隐私与鉴权 | 页面路径去掉查询和锚点；来源只留 origin；IP 仅取 Cloudflare 请求头；管理员使用 Bearer 密钥 |

后台密钥只保存在当前页面内存，刷新页面需重新输入，不使用 URL 参数或浏览器存储保存密钥。
来源限制只允许正式域名；本地预览默认不采集。不要为方便测试长期放开生产 CORS。
采集失败不能阻塞页面或计算；浏览器被强制终止可能丢失最后未发出的数据，KV 同步也可能有延迟。不能据此证明具体个人身份或实际阅读行为。

后台刷新与访客采集是两套独立频率。禁止为了节约后台查询而降低或关闭访客端计时。
KV 批量读取仍按 key 消耗读取额度；避免提高后台全量刷新频率。访问量增大后再评估缓存、增量读取或存储调整，不未经任务授权更换架构。

## 7. 发布与记录

- 按用户已授权范围提交与发布。GitHub Pages 与 Cloudflare Worker 独立部署，不能把成功推送当作 Worker 已更新。
- 统计服务接口与采集脚本同时变化时：先验证并部署 Worker，再发布前端，保留对旧客户端数据的兼容。
- Worker 发布命令：`npx wrangler deploy --config worker/wrangler.toml`。部署前可加 `--dry-run`；登录失效时走官方登录，不绕过鉴权。
- Worker 验证：`GET /health` 正常；未鉴权访问 `/api/visits` 返回 401；非法来源采集返回 403；有效采集返回 204，后台能看到记录。不要把真实记录复制进日志。
- 网站发布后检查 Pages 构建状态与线上实际资产版本，例如 `gh api repos/godlovedawei-cloud/daweisun-homepage/pages/builds/latest`。
- 只改后台显示不必重建工具缓存；只改文档不部署 Worker。发布受已有草稿影响时，单独准备本次变更的干净发布内容，不强制清理工作区。
- 每次有意义的交付更新 `Log.md`：日期、改动原因、结果、实际验证、发布状态和提交标识。尚未验证或发布必须明确写出。
- 日志超过约 300 行或跨年度时，把较早的已完成条目按年归档到 `docs/history/`，保留摘要和链接；当前待办留在 `Log.md`，不丢弃原始内容。
- 稳定规则变化时更新本文；具体临床核对放 `data/`，详细内容来源集中在 `docs/reference.md`。不要复制整段对话、终端输出或同一规则到多个文件。
- 临时截图、调试输出和缓存放已忽略的 `tmp/`、`.playwright-mcp/`、`.playwright-cli/`、`worker/.wrangler/` 等位置。清理前区分可重建产物与用户原始资料；大规模清理仍需明确确认。
