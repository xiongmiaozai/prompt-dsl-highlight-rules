// pre-release-check.mjs — 发布前自检脚本
// 运行命令：node scripts/pre-release-check.mjs（从 prompt-colorizer 目录运行）
// 检查规则文件完整性、颜色令牌引用、优先级冲突、版本一致性、远程可达性

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ============================================================
// 路径与常量定义
// ============================================================

// 脚本所在目录的父目录是 prompt-colorizer
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = dirname(__dirname);
const RULES_DIR = join(ROOT_DIR, 'rules');

// ANSI 颜色码
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

// 需要检查的 5 个 YAML 文件
const YAML_FILES = [
  '01-base-patterns.yaml',
  '02-semantic-context.yaml',
  '03-lexicon-optional.yaml',
  '04-theme-color.yaml',
  '05-priority.yaml',
];

// ============================================================
// 结果收集与输出
// ============================================================

const results = [];

function pass(n, name) {
  results.push({ ok: true });
  console.log(`${GREEN}✓ 检查项 ${n}: ${name} - 通过${RESET}`);
}

function fail(n, name, reason) {
  results.push({ ok: false });
  console.log(`${RED}✗ 检查项 ${n}: ${name} - 失败: ${reason}${RESET}`);
}

// ============================================================
// YAML 解析器动态加载
// 优先尝试 'yaml' 包，其次 'js-yaml'，都不可用则报错
// ============================================================

async function getYamlParser() {
  // 尝试 'yaml' 包
  try {
    const mod = await import('yaml');
    if (mod.parse) return mod.parse;
    if (mod.default && mod.default.parse) return mod.default.parse;
  } catch (_) {
    // 'yaml' 包不可用，继续尝试 'js-yaml'
  }
  // 尝试 'js-yaml' 包
  try {
    const mod = await import('js-yaml');
    if (mod.load) return mod.load;
    if (mod.default && mod.default.load) return mod.default.load;
  } catch (_) {
    // 'js-yaml' 包也不可用
  }
  throw new Error('未找到 YAML 解析包（yaml 或 js-yaml），请先运行：npm install yaml');
}

// ============================================================
// 主检查流程
// ============================================================

async function main() {
  // 加载 YAML 解析器
  let parseYaml = null;
  let yamlParserError = null;
  try {
    parseYaml = await getYamlParser();
  } catch (e) {
    yamlParserError = e.message;
  }

  // 存储解析后的 YAML 数据（供后续检查项使用）
  const parsedYaml = {};

  // ===== 检查项 1：YAML 语法合法 =====
  let yamlOk = true;
  let yamlError = '';
  if (parseYaml) {
    for (const file of YAML_FILES) {
      try {
        const content = readFileSync(join(RULES_DIR, file), 'utf8');
        parsedYaml[file] = parseYaml(content);
      } catch (e) {
        yamlOk = false;
        yamlError = `${file}: ${e.message}`;
        break;
      }
    }
    if (yamlOk) {
      pass(1, 'YAML 语法合法');
    } else {
      fail(1, 'YAML 语法合法', yamlError);
    }
  } else {
    fail(1, 'YAML 语法合法', yamlParserError);
  }

  // ===== 检查项 2：颜色令牌引用一致性 =====
  const themeColor = parsedYaml['04-theme-color.yaml'] || {};
  const colorsDef = themeColor.colors || {};
  const styleRules = themeColor.styleRules || {};
  const definedTokens = Object.keys(colorsDef);

  const undefinedRefs = [];
  if (definedTokens.length > 0 && Object.keys(styleRules).length > 0) {
    for (const [className, rule] of Object.entries(styleRules)) {
      // 检查 color 字段引用的令牌名
      const colorRef = rule.color;
      if (typeof colorRef === 'string' && colorRef.trim() !== '') {
        if (!definedTokens.includes(colorRef)) {
          undefinedRefs.push(`${className}.color -> "${colorRef}"`);
        }
      }
    }
  }

  if (undefinedRefs.length === 0) {
    pass(2, '颜色令牌引用一致性');
  } else {
    fail(2, '颜色令牌引用一致性', `未定义的引用 [${undefinedRefs.length}]: ${undefinedRefs.join(', ')}`);
  }

  // ===== 检查项 3：优先级无冲突 =====
  const priorityConfig = parsedYaml['05-priority.yaml'] || {};
  const priorityMap = priorityConfig.priority || {};
  // 收集 priority 对象中的所有数值
  const priorityValues = Object.values(priorityMap).filter(
    (v) => typeof v === 'number'
  );

  // 统计每个数值出现的次数，找出重复项
  const valueCount = {};
  for (const v of priorityValues) {
    valueCount[v] = (valueCount[v] || 0) + 1;
  }
  const duplicates = Object.entries(valueCount)
    .filter(([, count]) => count > 1)
    .map(([v, count]) => `值 ${v} 出现 ${count} 次`);

  if (duplicates.length === 0) {
    pass(3, '优先级无冲突');
  } else {
    fail(3, '优先级无冲突', `重复项: ${duplicates.join(', ')}`);
  }

  // ===== 检查项 4：version.json 字段完整 =====
  const versionPath = join(RULES_DIR, 'version.json');
  let versionOk = true;
  let versionError = '';
  let versionData = null;

  try {
    const content = readFileSync(versionPath, 'utf8');
    versionData = JSON.parse(content);
    const requiredFields = ['version', 'updateTime', 'mainBranch', 'rawBaseUrl'];
    const missingFields = requiredFields.filter((f) => !(f in versionData));

    if (missingFields.length > 0) {
      versionOk = false;
      versionError = `缺少字段: ${missingFields.join(', ')}`;
    } else {
      // mainBranch 必须等于 "main"
      if (versionData.mainBranch !== 'main') {
        versionOk = false;
        versionError = `mainBranch 应为 "main"，实际为 "${versionData.mainBranch}"`;
      }
      // version 必须符合语义化版本正则
      const versionRegex = /^\d+\.\d+\.\d+$/;
      if (versionOk && !versionRegex.test(versionData.version)) {
        versionOk = false;
        versionError = `version 不符合 X.Y.Z 格式，实际为 "${versionData.version}"`;
      }
      // updateTime 必须符合 YYYY-MM-DD 格式
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (versionOk && !dateRegex.test(versionData.updateTime)) {
        versionOk = false;
        versionError = `updateTime 不符合 YYYY-MM-DD 格式，实际为 "${versionData.updateTime}"`;
      }
      // rawBaseUrl 必须以 /main/rules 结尾且不带尾斜杠
      if (
        versionOk &&
        (!versionData.rawBaseUrl.endsWith('/main/rules') ||
          versionData.rawBaseUrl.endsWith('/'))
      ) {
        versionOk = false;
        versionError = `rawBaseUrl 应以 /main/rules 结尾且无尾斜杠，实际为 "${versionData.rawBaseUrl}"`;
      }
    }
  } catch (e) {
    versionOk = false;
    versionError = e.message;
  }

  if (versionOk) {
    pass(4, 'version.json 字段完整');
  } else {
    fail(4, 'version.json 字段完整', versionError);
  }

  // ===== 检查项 5：CHANGELOG 与 version.json 版本一致 =====
  const changelogPath = join(RULES_DIR, 'CHANGELOG.md');
  let changelogOk = true;
  let changelogError = '';

  try {
    if (!existsSync(changelogPath)) {
      changelogOk = false;
      changelogError = 'CHANGELOG.md 文件不存在';
    } else {
      const content = readFileSync(changelogPath, 'utf8');
      // 提取顶部第一个版本号（格式 ## [vX.Y.Z] 或 ## [X.Y.Z]）
      const match = content.match(/## \[v?(\d+\.\d+\.\d+)\]/);
      if (!match) {
        changelogOk = false;
        changelogError = '未找到版本号标题（格式 ## [vX.Y.Z]）';
      } else {
        const changelogVersion = match[1];
        const jsonVersion = versionData ? versionData.version : '';
        if (changelogVersion !== jsonVersion) {
          changelogOk = false;
          changelogError = `CHANGELOG 顶部版本 ${changelogVersion} 与 version.json 的 ${jsonVersion} 不一致`;
        }
      }
    }
  } catch (e) {
    changelogOk = false;
    changelogError = e.message;
  }

  if (changelogOk) {
    pass(5, 'CHANGELOG 与 version.json 版本一致');
  } else {
    fail(5, 'CHANGELOG 与 version.json 版本一致', changelogError);
  }

  // ===== 检查项 6：rawBaseUrl 可达性 =====
  let reachOk = false;
  let reachError = '';

  if (versionData && versionData.rawBaseUrl) {
    const url = `${versionData.rawBaseUrl}/version.json`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.status === 200) {
        reachOk = true;
      } else {
        reachError = `HTTP 状态码 ${res.status}`;
      }
    } catch (e) {
      reachError =
        e.name === 'AbortError' ? '请求超时（10 秒）' : e.message;
    }
  } else {
    reachError = 'version.json 中无 rawBaseUrl 字段';
  }

  if (reachOk) {
    pass(6, 'rawBaseUrl 可达性');
  } else {
    fail(6, 'rawBaseUrl 可达性', reachError);
  }

  // ===== 汇总结果 =====
  const allPassed = results.every((r) => r.ok);
  if (allPassed) {
    console.log(`\n${GREEN}所有检查通过！可以发布。${RESET}`);
    process.exit(0);
  } else {
    console.log(`\n${RED}检查失败！请修复上述问题后再发布。${RESET}`);
    process.exit(1);
  }
}

// 启动主流程
main().catch((e) => {
  console.error(`${RED}脚本异常: ${e.message}${RESET}`);
  process.exit(1);
});
