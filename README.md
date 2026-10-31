# Dawei Sun — academic website

Dawei Sun 的英文个人学术主页，包含经历、24 篇论文、公开 CV，以及成人和儿科麻醉参考工具。

- 网站：[daweisun.com](https://daweisun.com)
- 仓库：[godlovedawei-cloud/daweisun-homepage](https://github.com/godlovedawei-cloud/daweisun-homepage)
- 托管：GitHub Pages，`main` 分支根目录；访客统计另由 Cloudflare Worker 部署。

## 维护入口

| 文档 | 内容 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | 唯一维护规范：结构、约束、构建、验证与发布 |
| [Log.md](Log.md) | 重要变更、发布状态及当前待办 |
| [内容依据与技术参考](docs/reference.md) | 履历来源、历史决定、详细工具与统计说明 |

新增变更写入日志；稳定规则更新 AGENTS；详细依据进入对应参考文档，避免在多处重复维护。

## 本机预览

```sh
python3 scripts/build_site.py --pages-only
python3 -m http.server 4173 --bind 127.0.0.1
```

打开 [本机预览](http://127.0.0.1:4173/)。`--pages-only` 保留公开 CV，但也会更新工具缓存版本；构建前检查未发布草稿，发布前检查生成差异。
只有需要更新 CV 时才运行不带 `--pages-only` 的完整构建，所需 ReportLab 与字体见维护规范。

## 验证与发布

- 按改动选择 [维护规范中的验证命令](AGENTS.md#4-构建预览与验证)，文档整理不运行无关临床测试。
- 编辑生成源 `scripts/build_site.py`，不要只改 `index.html` 或 `publications.html`。
- 工具或共享统计脚本变更后，运行 `python3 scripts/build_anesthesia_tool.py` 更新离线版本。
- 推送 `main` 会触发 Pages 发布；统计 Worker 单独发布，不能混为一次部署。
- 当前本地儿科重构仍是未发布草稿，状态见 [项目日志](Log.md#当前待办)。

患者输入和记录仅保存在浏览器，统计脚本不读取或上传。儿科工具仍是未验证的测试版本。
GitHub Pages 会公开仓库文件；不要提交密钥、真实访客 IP、患者数据、私有 CV 或临床原始资料。
