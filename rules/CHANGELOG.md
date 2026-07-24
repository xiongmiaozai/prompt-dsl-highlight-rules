# 变更日志

本文件记录提示词 DSL 高亮规则库的所有版本变更，遵循 [Keep a Changelog](https://keepachangelog.com/) 简化版格式，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [v2.4.0] - 2026-07-24

### Added
- `01-base-patterns.yaml` 新增 14 个 AI 多模态扩展 pattern，覆盖语音/音乐/数字人/3D/Agent/翻译等场景：
  - `ssml_tag` — SSML 语音合成标签（`<prosody>`、`<emphasis>`、`<break>`、`<voice>`、`<say-as>` 等）
  - `lyric_section` — 歌词段落标签（`[Verse]`、`[Chorus]`、`[Bridge]`、`[Outro]` 等）
  - `suno_meta` — Suno 风格元标签（`[style: pop]`、`[genre: rock]`、`[mood: happy]` 等）
  - `avatar_directive` — 数字人/虚拟主播指令（`[emotion]happy[/emotion]`、`[gesture]wave[/gesture]`、`[pause]` 等）
  - `copilot_formula` — Excel Copilot 函数（`=COPILOT(...)`、`=AI(...)`、`=GPT(...)`、`=CLAUDE(...)` 等）
  - `react_marker` — ReAct Agent 标记（`Thought:`、`Action:`、`Observation:`、`Final Answer:` 等，块级）
  - `cot_trigger` — CoT 触发短语（`Let's think step by step`、`让我们一步步思考` 等）
  - `model_identifier` — AI 模型标识符（`gpt-4`、`claude-3-opus`、`gemini-pro`、`dall-e-3`、`midjourney-v6`、`sora`、`pika`、`hunyuan` 等）
  - `comfyui_node` — ComfyUI 节点调用（`KSampler(...)`、`CLIPTextEncode(...)`、`VAEDecode(...)` 等）
  - `pika_parameter` — Pika 视频参数（`--camera pan right`、`--motion 5`、`--fps 24` 等）
  - `runway_parameter` — Runway Gen 参数（`--prompt`、`--motion_score`、`--safety_check` 等）
  - `translation_marker` — 翻译任务标记（`Source:`、`Target:`、`原文：`、`译文：` 等，块级）
  - `fewshot_marker` — Few-shot 示例标记（`Example:`、`示例：`、`Q:`、`A:` 等，块级）
  - `gen3d_platform` — 3D 生成平台标识（`[Meshy]`、`[Hunyuan3D]`、`[Rodin]`、`[Hyper3D]` 等）
- `02-semantic-context.yaml` 新增 26 个上下文映射区块：
  - 语音/音乐：`【语音合成】`、`【SSML配置】`、`【音乐生成】`、`【歌词创作】`
  - 数字人：`【数字人】`、`【虚拟主播】`
  - 3D 生成：`【3D建模】`、`【3D生成】`
  - 数据/Excel：`【数据分析】`、`【Excel AI】`
  - Agent/推理：`【Agent系统】`、`【ReAct流程】`、`【CoT推理】`
  - 设计类：`【Logo设计】`、`【图标设计】`、`【室内设计】`、`【建筑设计】`
  - 创作/游戏：`【漫画创作】`、`【绘本创作】`、`【游戏开发】`、`【NPC对话】`
  - 通用任务：`【翻译任务】`、`【Few-shot示例】`、`【模型对比】`、`【ComfyUI工作流】`、`【视频生成】`
- `03-lexicon-optional.yaml` 新增 6 个词典分类：
  - `music_structure` — 音乐结构术语（Verse、Chorus、Bridge、主歌、副歌、桥段 等）
  - `avatar_emotion` — 数字人情绪指令（happy、sad、angry、neutral、惊讶、愤怒 等）
  - `avatar_gesture` — 数字人手势指令（wave、nod、shake、point、挥手、点头 等）
  - `tts_emotion` — TTS 语音情绪标签（cheerful、sad、angry、excited、friendly、hopeful 等）
  - `interior_style` — 室内设计风格（现代、北欧、工业、极简、新中式、Art Deco 等）
  - `logo_style` — Logo 设计风格（极简、扁平、几何、徽章、字标、负空间 等）
- `03-lexicon-optional.yaml` 的 `cssClassMap` 补全 6 条映射：
  - `music_structure` → `dsl-lexicon-music-structure`
  - `avatar_emotion` → `dsl-lexicon-avatar-emotion`
  - `avatar_gesture` → `dsl-lexicon-avatar-gesture`
  - `tts_emotion` → `dsl-lexicon-tts-emotion`
  - `interior_style` → `dsl-lexicon-interior-style`
  - `logo_style` → `dsl-lexicon-logo-style`
- `04-theme-color.yaml` 新增 8 个颜色令牌（多模态扩展令牌区）：
  - `music` — 品红（音乐生成，Suno 歌词段落）
  - `avatar` — 粉色（数字人情绪/手势指令）
  - `tts` — 橙色（SSML 标签、TTS 情绪）
  - `agent` — 深紫（ReAct 标记、CoT 触发）
  - `excel` — 翠绿（Copilot 函数、Excel AI）
  - `gen3d` — 青色（3D 生成平台标识）
  - `comfyui` — 青绿（ComfyUI 节点调用）
  - `runway` — 靛蓝（Runway/Pika 视频参数）
- `04-theme-color.yaml` 新增 20 条 styleRules：
  - 14 条 pattern 样式：`dsl-ssml-tag`、`dsl-lyric-section`、`dsl-suno-meta`、`dsl-avatar-directive`、`dsl-copilot-formula`、`dsl-react-marker`、`dsl-cot-trigger`、`dsl-model-identifier`、`dsl-comfyui-node`、`dsl-pika-parameter`、`dsl-runway-parameter`、`dsl-translation-marker`、`dsl-fewshot-marker`、`dsl-gen3d-platform`
  - 6 条词典样式：`dsl-lexicon-music-structure`、`dsl-lexicon-avatar-emotion`、`dsl-lexicon-avatar-gesture`、`dsl-lexicon-tts-emotion`、`dsl-lexicon-interior-style`、`dsl-lexicon-logo-style`

### Changed
- `version.json` 版本号从 `2.3.1` 升级到 `2.4.0`（次版本号变更，新增多模态扩展能力，向后兼容）

### 背景
本次扩展系统性覆盖了当前主流 AI 多模态提示词场景，包括：
- **语音合成**（TTS/SSML）：阿里云、Azure、Google TTS、Edge-TTS 等使用 SSML 标签控制语速/音量/情感
- **音乐生成**（Suno/Udio）：歌词段落标签、风格元标签
- **数字人/虚拟主播**（HeyGen/D-ID/Synthesia）：情绪、手势、动作指令
- **3D 建模**（Meshy/Hunyuan3D/Rodin）：平台标识
- **数据分析/Excel AI**（Copilot）：函数调用
- **Agent 系统**（ReAct/CoT）：思维链、推理标记
- **设计类**（Logo/图标/室内/建筑）：风格术语
- **创作类**（漫画/绘本/游戏）：场景区块
- **通用任务**（翻译/Few-shot/模型对比/ComfyUI/视频生成）：标记与参数

规则库现已覆盖 17 种视频提示词元素 + 11 种基础元素 + 14 种多模态扩展元素，合计 42 种元素类型，可满足绝大多数 AI 工具与提示词工程场景的高亮需求。

## [v2.3.1] - 2026-07-24

### Added
- 新增 `shot_id` pattern（`01-base-patterns.yaml`），识别多段连字符分镜编号格式：`分镜 1-0-6-1`、`分镜 1-0-6-2`
- 新增 `focal_length` 词典分类（`03-lexicon-optional.yaml`），10 个焦段术语：长焦微距、人像焦段、广角焦段等
- 新增 `performance` 词典分类（`03-lexicon-optional.yaml`），14 个影视表演术语：腰背挺直、冷淡无视、娇柔谄媚等
- 扩展 `shot_size` 词典，新增 4 个组合景别词：手部极致微距特写、竖屏单人近景、微距特写、极致微距
- 扩展 `camera_fixed` 词典，新增 9 个运镜术语：跟手动态运镜、匀速移动、平稳拉镜、微推锁定、呼吸晃动、静止定格等
- 扩展 `light_effect` 词典，新增 6 个光影术语：局部单点烛光、明暗分割、明暗交界、大面积虚化压暗等
- 新增 3 条 styleRules（`04-theme-color.yaml`）：dsl-shot-id、dsl-lexicon-focal-length、dsl-lexicon-performance

### Fixed
- 补全 v2.3.0 遗漏的 `cssClassMap` 映射：shot_size、camera_fixed、blocking 三个分类未在 `03-lexicon-optional.yaml` 的 cssClassMap 中注册，导致插件无法正确识别这些词典分类的 className。现补全映射：
  - `shot_size` → `dsl-lexicon-shot-size`
  - `camera_fixed` → `dsl-lexicon-camera-fixed`
  - `blocking` → `dsl-lexicon-blocking`

### Changed
- 在 `02-semantic-context.yaml` 的"分镜模块"区块中添加 `shot_id` 到 allowPatterns

### 背景
基于用户提供的第二段分镜脚本样本（分镜 1-0-6-1/1-0-6-2，含焦段参数、表演细节、复杂运镜描述、烛光光影等）做元素类型分析。该样本使用了多段连字符编号格式（`分镜 1-0-6-1`），现有 shot_header 不支持"分镜"关键字，故新增 `shot_id` pattern。同时补齐焦段、表演、运镜、光影等细分领域的专业术语词典。

## [v2.3.0] - 2026-07-24

### Added
- 新增 8 个基础结构 pattern（`01-base-patterns.yaml`），覆盖影视分镜脚本场景：
  - `segment_header` — 段落标题（A 段 13s｜描述）
  - `module_header` — 模块标题（模块 1 方向锁）
  - `dialogue_speaker` — 台词标注（台词 Draven（低哑蛊惑）：）
  - `character_def` — 角色定义（Draven（S 主，高位强势方）：）
  - `book_title` — 书名号引用（《他是龙》）
  - `cn_chapter` — 中文序号章节（一、二、三、）
  - `time_range` — 时间范围（0-4s）
  - `section_note` — 段落小标题（本段调度说明、全局约束）
- 新增 6 个上下文映射区块（`02-semantic-context.yaml`）：段落说明、分镜模块、调度设计、角色设定扩展、全局设定、影视对标
- 新增 3 个词典分类（`03-lexicon-optional.yaml`）：
  - `shot_size` — 16 个组合景别词（双人近景、上半身特写等）
  - `camera_fixed` — 24 个机位运动词（微俯固定、缓慢前推等）
  - `blocking` — 32 个影视调度术语（场面调度、动线、轴线等）
- 新增 3 个颜色令牌（`04-theme-color.yaml`）：
  - `segment` — 深红橙系（段落标题）
  - `module` — 深青蓝系（模块标题）
  - `reference` — 深紫罗兰系（书名号引用）
- 新增 11 条 styleRules，映射新 pattern 与词典到颜色令牌

### Changed
- 增强 `shot_header` 正则（`01-base-patterns.yaml`），支持「时间范围 + ｜分隔符 + 景别机位」复合格式：
  - 旧格式 `镜头1（3秒）` 向后兼容
  - 新格式 `镜头 1（0-4s｜双人近景，微俯固定）` 完整识别

### 背景
基于用户提供的真实分镜脚本样本（B 段 13s｜肢体侵略・撕破伪装外衣）做穷举式元素类型分析，识别出 22 类元素，其中 9 类未覆盖、3 类部分覆盖。本次扩展补齐全部缺口，使规则库完整支持影视分镜脚本场景的高亮识别。

## [v2.2.0] - 2026-07-24

### Added
- 新增 `CHANGELOG.md` 变更日志文件，建立版本迭代记录机制
- 新增 `README.md` 运维说明文档，包含目录结构、版本策略、发布工作流、自检清单、下游拉取协议、回滚指引
- 新增 `scripts/pre-release-check.mjs` 发布前自检脚本，覆盖 6 项检查（YAML 语法、颜色令牌引用、优先级冲突、version.json 字段、CHANGELOG 一致性、rawBaseUrl 可达性）
- 新增 `scripts/release.mjs` 发布脚本，封装自检 → 版本升级 → 日志追加 → git 提交推送的完整流程
- `04-theme-color.yaml` 新增 `colors` 区块：25 个颜色令牌（基础 10 + 扩展 15），支持 `.soft` 与 `.border` 修饰符自动生成 CSS 变量

### Changed
- `04-theme-color.yaml` 的 `styleRules` 区全部改用令牌引用（如 `color: "danger"`），由编译器解析为 `var(--dsl-*)`
- 移除所有硬编码 hex/rgba 值，颜色完全由 YAML 规则驱动，插件代码零硬编码

### Fixed
- 修复 `version.json` 分支配置错误：将 `mainBranch` 从 `prompt-dsl` 改为 `main`
- 修复 `version.json` 的 `rawBaseUrl` 配置：从 `https://raw.githubusercontent.com/xiongmiaozai/prompt-dsl-highlight-rules/prompt-dsl/rules` 改为 `https://raw.githubusercontent.com/xiongmiaozai/prompt-dsl-highlight-rules/main/rules`
  - 原因：`prompt-dsl` 分支已通过 PR #2 合并到 `main` 后删除，继续引用会导致 `rawBaseUrl` 404
  - 影响文件：`version.json`
  - 下游消费者需同步更新拉取地址到 `main` 分支

## [v2.0.0] - 2026-07-24

### Added
- 初始化 DSL 着色规则系统，提交内容总览：
  - 6 个文件，5887 行新增
  - 87 个基础正则规则（覆盖提示词语法、Markdown 全量符号、操作档案、AI 工具结构化语法）— `01-base-patterns.yaml`
  - 39 个行业词典 / 3885 条专业术语 — `03-lexicon-optional.yaml`
  - 27 个上下文映射区块 + 6 个扫描状态 — `02-semantic-context.yaml`
  - 125 个 CSS 配色定义 — `04-theme-color.yaml`
  - 4 层优先级体系 — `05-priority.yaml`
- 新增 `version.json` 版本信息文件
- 新增 `LICENSE` 许可证文件
