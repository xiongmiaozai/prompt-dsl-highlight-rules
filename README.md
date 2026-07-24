# 提示词 DSL 高亮规则库

本规则库为提示词 DSL 高亮引擎提供规则数据源，托管在 GitHub 仓库 `xiongmiaozai/prompt-dsl-highlight-rules` 的 `main` 分支，由 Obsidian 插件（prompt-colorizer）通过 raw URL 远程拉取消费。规则文件以 YAML 形式组织，按编号顺序加载，覆盖基础正则、语义上下文、行业词典、主题配色与优先级配置。

## 目录结构

```
prompt-colorizer/
├── scripts/
│   ├── pre-release-check.mjs   # 发布前自检脚本
│   └── release.mjs              # 发布脚本
└── rules/
    ├── 01-base-patterns.yaml    # 基础正则规则
    ├── 02-semantic-context.yaml # 语义上下文映射
    ├── 03-lexicon-optional.yaml # 行业词典
    ├── 04-theme-color.yaml      # 主题配色（动态颜色引擎，含 colors 与 styleRules 区块）
    ├── 05-priority.yaml         # 优先级配置
    ├── version.json             # 版本信息（version, updateTime, mainBranch, rawBaseUrl）
    ├── CHANGELOG.md             # 变更日志
    └── README.md                # 本文档
```

各文件作用说明：

- `01-base-patterns.yaml`：定义基础正则匹配规则，是高亮引擎的核心规则源。
- `02-semantic-context.yaml`：定义语义上下文映射，将匹配结果归类到语义区块。
- `03-lexicon-optional.yaml`：可选的行业词典扩展，用于增强特定领域的识别能力。
- `04-theme-color.yaml`：主题配色，包含 `colors`（颜色令牌定义）与 `styleRules`（样式规则引用）两个区块，构成动态颜色引擎。
- `05-priority.yaml`：规则优先级配置，解决多条规则命中同一区间时的冲突。
- `version.json`：版本元信息，下游插件据此判断是否需要更新。
- `CHANGELOG.md`：变更日志，每次发布自动追加。
- `scripts/pre-release-check.mjs`：发布前自检脚本，校验规则文件完整性。
- `scripts/release.mjs`：发布脚本，自动更新版本并推送。

## 版本号策略

遵循语义化版本（Semantic Versioning）规范：

| 变更类型 | 升级位 | 示例 |
|---------|--------|------|
| 修复 bug、调整正则不改变匹配语义 | PATCH | 2.2.0 → 2.2.1 |
| 新增规则、扩展词典、新增颜色令牌、新增上下文区块 | MINOR | 2.2.0 → 2.3.0 |
| 删除规则、重命名令牌、改变匹配语义、不向后兼容的结构变更 | MAJOR | 2.2.0 → 3.0.0 |

## 发布工作流

1. 本地编辑规则文件（5 个 YAML 之一）
2. 运行自检：`node scripts/pre-release-check.mjs`（在 `prompt-colorizer` 目录下执行）
3. 全部通过后，运行发布脚本：`node scripts/release.mjs`（支持 `--patch` / `--minor` / `--major` 参数）
4. 脚本会自动：更新 `version.json` → 追加 `CHANGELOG.md` → `git commit` + `push`
5. 推送后验证：访问 `https://raw.githubusercontent.com/xiongmiaozai/prompt-dsl-highlight-rules/main/rules/version.json` 确认已更新

## 自检清单

`pre-release-check.mjs` 会执行以下 6 项检查：

1. **YAML 语法校验**：确保 5 个 YAML 文件均可正确解析，无语法错误。
2. **颜色令牌引用校验**：检查 `styleRules` 中引用的颜色令牌是否已在 `colors` 区块中定义，杜绝悬空引用。
3. **优先级冲突检测**：检查 `05-priority.yaml` 中是否存在重复或互相矛盾的优先级声明。
4. **version.json 字段校验**：确认 `version`、`updateTime`、`mainBranch`、`rawBaseUrl` 四个字段齐全且格式合法。
5. **CHANGELOG 一致性**：确认最新版本号与 `version.json` 中的 `version` 字段一致。
6. **rawBaseUrl 可达性**：探测远程 `rawBaseUrl` 是否可访问，避免发布后下游拉取失败。

## 下游拉取协议

下游 Obsidian 插件按以下流程拉取规则：

1. 请求远程 `version.json`
2. 比对本地缓存版本
3. 版本相同：跳过本次拉取
4. 版本不同：拉取全部 5 个 YAML 文件
5. 拉取失败：保留上一版本缓存，不阻塞插件运行

## 回滚指引

当新版本出现问题需要回退到历史版本时：

- 通过 `git log` 找到目标版本的 commit SHA
- 通过 `git checkout <sha> -- rules/` 恢复文件
- 或下游插件固定拉取某个 commit SHA 的 raw URL，格式为：
  `https://raw.githubusercontent.com/xiongmiaozai/prompt-dsl-highlight-rules/<sha>/rules/...`
- 回滚后需同步更新 `version.json` 并发布新版本（PATCH 升级），不要使用 `force push`

## 约束与注意事项

- 所有 YAML 文件必须使用 UTF-8 无 BOM 编码
- 颜色令牌禁止硬编码 `hex`/`rgba`，必须通过 `colors` 区块定义后引用
- `mainBranch` 字段必须为 `main`，不得改回其他分支
- `rawBaseUrl` 不得带尾斜杠
- 重大改动（MAJOR 升级）必须通过 PR 评审，不得直接推送 `main`
