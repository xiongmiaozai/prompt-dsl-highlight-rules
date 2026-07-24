// release.mjs — 发布脚本
// 运行命令：node scripts/release.mjs [--patch|--minor|--major] [--desc "描述"] [--notes "Added: xxx\nFixed: yyy"]
// 从 prompt-colorizer 目录运行
// 流程：自检 → 版本升级 → 收集变更 → 更新 version.json → 追加 CHANGELOG → git 提交推送

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { spawnSync } from 'node:child_process';

// ============================================================
// 路径与常量定义
// ============================================================

// 脚本所在目录的父目录是 prompt-colorizer
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = dirname(__dirname);
const RULES_DIR = join(ROOT_DIR, 'rules');
const SCRIPTS_DIR = join(ROOT_DIR, 'scripts');
const VERSION_PATH = join(RULES_DIR, 'version.json');
const CHANGELOG_PATH = join(RULES_DIR, 'CHANGELOG.md');
const PRE_CHECK_SCRIPT = join(SCRIPTS_DIR, 'pre-release-check.mjs');

// ANSI 颜色码
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// ============================================================
// 工具函数
// ============================================================

// 获取当天日期 YYYY-MM-DD
function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 版本号计算函数
// 参数：currentVersion 形如 "2.2.0"，bumpType 为 'patch'/'minor'/'major'
// 返回：新版本号字符串
function bumpVersion(currentVersion, bumpType) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(currentVersion);
  if (!match) {
    throw new Error(`当前版本号格式不合法：${currentVersion}`);
  }
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = parseInt(match[3], 10);
  switch (bumpType) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    default:
      throw new Error(`不支持的升级位：${bumpType}`);
  }
}

// CHANGELOG 插入函数
// 参数：content 当前 CHANGELOG 内容，newVersion 新版本号（如 "2.3.0"），date 日期
//      groups 分组条目对象 { Added: [], Changed: [], Fixed: [], Removed: [], BREAKING: [] }
// 返回：新内容（在第一个版本标题前插入新条目，保持原有内容）
function insertChangelogEntry(content, newVersion, date, groups) {
  // 构造新条目文本
  const lines = [];
  lines.push(`## [v${newVersion}] - ${date}`);
  lines.push('');

  // 按固定顺序输出有内容的分组
  const order = ['BREAKING', 'Added', 'Changed', 'Fixed', 'Removed'];
  for (const key of order) {
    const items = groups[key];
    if (items && items.length > 0) {
      // BREAKING 类型使用特殊的标题名
      lines.push(key === 'BREAKING' ? '### BREAKING CHANGES' : `### ${key}`);
      for (const item of items) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
  }

  // join 后末尾带换行（因最后一项是空字符串），再补一个换行形成空行分隔
  const newEntry = lines.join('\n');

  // 在第一个 ## [vX.Y.Z] 版本标题前插入
  const versionTitleRegex = /## \[v?\d+\.\d+\.\d+\][^\n]*\n/;
  const match = content.match(versionTitleRegex);
  if (!match) {
    // 未找到任何版本标题，追加到文件末尾
    const prefix = content.endsWith('\n') ? content : content + '\n';
    return prefix + newEntry + '\n';
  }

  const insertIndex = match.index;
  return content.slice(0, insertIndex) + newEntry + '\n' + content.slice(insertIndex);
}

// 解析 CHANGELOG 条目输入
// 每行格式 "类型: 描述"，类型支持 Added/Changed/Fixed/Removed/BREAKING（不区分大小写）
function parseChangelogInput(lines) {
  const groups = {
    Added: [],
    Changed: [],
    Fixed: [],
    Removed: [],
    BREAKING: [],
  };
  // 类型名到分组键的映射（含常见别名）
  const typeMap = {
    added: 'Added',
    add: 'Added',
    new: 'Added',
    changed: 'Changed',
    change: 'Changed',
    updated: 'Changed',
    update: 'Changed',
    fixed: 'Fixed',
    fix: 'Fixed',
    removed: 'Removed',
    remove: 'Removed',
    delete: 'Removed',
    breaking: 'BREAKING',
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // 匹配 "类型: 描述" 或 "类型：描述"（支持中英文冒号）
    const m = /^(\w+)\s*[:：]\s*(.+)$/.exec(trimmed);
    if (!m) {
      console.log(`${YELLOW}跳过无法解析的行：${trimmed}${RESET}`);
      continue;
    }
    const rawType = m[1].toLowerCase();
    const desc = m[2].trim();
    const group = typeMap[rawType];
    if (!group) {
      console.log(`${YELLOW}未知类型 "${m[1]}"，跳过：${trimmed}${RESET}`);
      continue;
    }
    groups[group].push(desc);
  }
  return groups;
}

// ============================================================
// 交互式输入
// ============================================================

// 创建 readline 接口
function createRl() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// 单行提问
function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// 多行输入，空行结束
async function askMultiLine(rl, prompt) {
  // 先显示提示文本（单独一行，避免提示过长被截断）
  console.log(prompt);
  const lines = [];
  // 持续读取直到输入空行
  for (;;) {
    const answer = await new Promise((resolve) => {
      rl.question('', (ans) => resolve(ans));
    });
    if (answer.trim() === '') break;
    lines.push(answer);
  }
  return lines;
}

// ============================================================
// 命令行参数解析
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  let bumpArg = null; // 'patch' / 'minor' / 'major'
  let descArg = null; // --desc 的值
  let notesArg = null; // --notes 的值

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--patch' || a === '--minor' || a === '--major') {
      bumpArg = a.slice(2); // 去掉 "--" 前缀
    } else if (a === '--desc') {
      descArg = args[i + 1] != null ? args[i + 1] : null;
      i++;
    } else if (a === '--notes') {
      notesArg = args[i + 1] != null ? args[i + 1] : null;
      i++;
    }
  }

  return { bumpArg, descArg, notesArg };
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  const { bumpArg, descArg, notesArg } = parseArgs();

  // ===== 步骤 1/7：运行自检 =====
  console.log(`${CYAN}===== 步骤 1/7：运行发布前自检 =====${RESET}`);
  const checkResult = spawnSync('node', [PRE_CHECK_SCRIPT], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });
  if (checkResult.status !== 0) {
    console.error(`${RED}自检失败，发布中止${RESET}`);
    process.exit(1);
  }
  console.log();

  // 读取当前 version.json
  let versionData;
  try {
    versionData = JSON.parse(readFileSync(VERSION_PATH, 'utf8'));
  } catch (e) {
    console.error(`${RED}读取 version.json 失败：${e.message}${RESET}`);
    process.exit(1);
  }
  const currentVersion = versionData.version;

  // 创建 readline 接口（交互式步骤需要）
  const rl = createRl();

  try {
    // ===== 步骤 2/7：选择版本升级位 =====
    let bumpType;
    if (bumpArg) {
      // 参数模式：跳过交互选择
      bumpType = bumpArg;
      console.log(`${CYAN}===== 步骤 2/7：版本升级位（命令行指定） =====${RESET}`);
      console.log(`已指定升级位：${bumpType.toUpperCase()}`);
    } else {
      // 默认模式：交互式选择
      console.log(`${CYAN}===== 步骤 2/7：选择版本升级位 =====${RESET}`);
      const previewPatch = bumpVersion(currentVersion, 'patch');
      const previewMinor = bumpVersion(currentVersion, 'minor');
      const previewMajor = bumpVersion(currentVersion, 'major');
      console.log(`当前版本：${currentVersion}`);
      console.log('请选择本次发布的版本升级位：');
      console.log(`  1) PATCH (${currentVersion} → ${previewPatch}) — 修复 bug、调整正则不改变匹配语义`);
      console.log(`  2) MINOR (${currentVersion} → ${previewMinor}) — 新增规则、扩展词典、新增颜色令牌`);
      console.log(`  3) MAJOR (${currentVersion} → ${previewMajor}) — 删除规则、重命名令牌、不向后兼容`);
      const choice = await ask(rl, '请输入 1/2/3：');
      const trimmedChoice = choice.trim();
      if (trimmedChoice === '1') {
        bumpType = 'patch';
      } else if (trimmedChoice === '2') {
        bumpType = 'minor';
      } else if (trimmedChoice === '3') {
        bumpType = 'major';
      } else {
        console.error(`${RED}无效的选择：${choice}${RESET}`);
        process.exit(1);
      }
    }
    console.log();

    // 计算新版本号
    let newVersion;
    try {
      newVersion = bumpVersion(currentVersion, bumpType);
    } catch (e) {
      console.error(`${RED}版本号计算错误：${e.message}${RESET}`);
      process.exit(1);
    }
    console.log(`新版本号：${GREEN}${newVersion}${RESET}`);
    console.log();

    // ===== 步骤 3/7：收集变更描述 =====
    console.log(`${CYAN}===== 步骤 3/7：收集变更描述 =====${RESET}`);
    let description;
    if (descArg) {
      // 命令行参数提供，跳过交互
      description = descArg;
      console.log(`已指定描述：${description}`);
    } else {
      description = await ask(rl, '请输入本次发布的一句话变更描述（用于 commit message）：');
      if (!description.trim()) {
        console.error(`${RED}变更描述不能为空${RESET}`);
        process.exit(1);
      }
    }
    console.log();

    // ===== 步骤 4/7：收集 CHANGELOG 条目 =====
    console.log(`${CYAN}===== 步骤 4/7：收集 CHANGELOG 条目 =====${RESET}`);
    let groups;
    if (notesArg) {
      // 命令行参数提供，跳过交互
      console.log('已通过 --notes 参数提供变更条目');
      // 处理 \n 转义（命令行传入的字面 \n）和真实换行
      const noteLines = notesArg.split(/\\n|\r?\n/);
      groups = parseChangelogInput(noteLines);
    } else {
      const noteLines = await askMultiLine(
        rl,
        '请输入 CHANGELOG 变更条目（多行输入，空行结束。每行格式如 `Added: 新增 XXX 规则` 或 `Fixed: 修复 XXX 问题`）：'
      );
      groups = parseChangelogInput(noteLines);
    }

    // 校验是否收集到有效条目
    const totalEntries = Object.values(groups).reduce((sum, arr) => sum + arr.length, 0);
    if (totalEntries === 0) {
      console.error(`${RED}未输入任何有效的 CHANGELOG 条目${RESET}`);
      process.exit(1);
    }
    console.log(`已收集 ${totalEntries} 条变更记录`);
    console.log();

    // ===== 步骤 5/7：更新 version.json =====
    console.log(`${CYAN}===== 步骤 5/7：更新 version.json =====${RESET}`);
    const today = getToday();
    // 保留 mainBranch 与 rawBaseUrl 不变，仅更新 version 和 updateTime
    const newVersionData = {
      ...versionData,
      version: newVersion,
      updateTime: today,
    };
    try {
      writeFileSync(VERSION_PATH, JSON.stringify(newVersionData, null, 2) + '\n', 'utf8');
      console.log(`${GREEN}已更新 version.json：version=${newVersion}, updateTime=${today}${RESET}`);
    } catch (e) {
      console.error(`${RED}写入 version.json 失败：${e.message}${RESET}`);
      process.exit(1);
    }
    console.log();

    // ===== 步骤 6/7：追加 CHANGELOG 条目 =====
    console.log(`${CYAN}===== 步骤 6/7：追加 CHANGELOG 条目 =====${RESET}`);
    let changelogContent;
    try {
      changelogContent = readFileSync(CHANGELOG_PATH, 'utf8');
    } catch (e) {
      console.error(`${RED}读取 CHANGELOG.md 失败：${e.message}${RESET}`);
      process.exit(1);
    }
    const newChangelog = insertChangelogEntry(changelogContent, newVersion, today, groups);
    try {
      writeFileSync(CHANGELOG_PATH, newChangelog, 'utf8');
      console.log(`${GREEN}已更新 CHANGELOG.md，新增版本 v${newVersion} 条目${RESET}`);
    } catch (e) {
      console.error(`${RED}写入 CHANGELOG.md 失败：${e.message}${RESET}`);
      process.exit(1);
    }
    console.log();

    // ===== 步骤 7/7：git 提交推送 =====
    console.log(`${CYAN}===== 步骤 7/7：git 提交推送 =====${RESET}`);

    // git add rules/version.json rules/CHANGELOG.md
    const addResult = spawnSync('git', ['add', 'rules/version.json', 'rules/CHANGELOG.md'], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    if (addResult.status !== 0) {
      console.error(`${RED}git add 失败${RESET}`);
      console.error(`${YELLOW}请手动检查 git 状态后重试${RESET}`);
      process.exit(1);
    }

    // git commit
    const commitMsg = `release: v${newVersion} - ${description}`;
    const commitResult = spawnSync('git', ['commit', '-m', commitMsg], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    if (commitResult.status !== 0) {
      console.error(`${RED}git commit 失败${RESET}`);
      console.error(`${YELLOW}请手动检查 git 状态后重试${RESET}`);
      process.exit(1);
    }

    // git push origin main
    const pushResult = spawnSync('git', ['push', 'origin', 'main'], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    if (pushResult.status !== 0) {
      console.error(`${RED}git push 失败${RESET}`);
      console.error(`${YELLOW}请检查网络连接后手动执行 \`git push origin main\`${RESET}`);
      process.exit(1);
    }

    console.log();
    console.log(`${GREEN}发布完成！版本 v${newVersion} 已推送到 origin/main${RESET}`);
  } finally {
    rl.close();
  }
}

// 启动主流程
main().catch((e) => {
  console.error(`${RED}脚本异常: ${e.message}${RESET}`);
  process.exit(1);
});
