#!/usr/bin/env node
/*
 * 문서 레포를 검사하고 사이트(plat-fe /docs)가 읽는 묶음 JSON 을 만든다.
 *
 *   node scripts/build-bundle.mjs --sha <커밋> --out <폴더>
 *   node scripts/build-bundle.mjs --check            # 검사만
 *
 * 규칙은 README.md 의 "작성 규칙" 과 같다. 어긋난 곳은 `파일:줄 내용` 으로 모아 한 번에 알려 준다.
 * Node 내장 모듈만 쓴다(설치 없이 Actions 에서 바로 돈다).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const REPO = "PLAT-AI-APP/plat-docs";
const SITE_BASE = "/docs";
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ORDER_PREFIX = /^\d+-/;
const MAX_GROUP_DEPTH = 3;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
const PAGE_KEYS = new Set(["title", "summary"]);
const GROUP_KEYS = new Set(["title", "description", "cover"]);
/* 마크다운 이미지·링크: ![alt](target) / [text](target). 대상 뒤 "제목" 은 남겨 둔다. */
const MARKDOWN_TARGET = /(!?)\[([^\]]*)\]\(\s*([^)\s]+)([^)]*)\)/g;

export class BundleError extends Error {
  constructor(problems) {
    super(`문서 규칙 위반 ${problems.length}건\n${problems.join("\n")}`);
    this.problems = problems;
  }
}

const toPosix = (path) => path.split(sep).join("/");

/** 파일·디렉토리 이름에서 정렬용 접두어를 뗀 slug. 확장자는 호출하는 쪽이 뗀다. */
const slugOf = (name) => name.replace(ORDER_PREFIX, "");

const visibleEntries = (dir) =>
  readdirSync(dir)
    .filter((name) => !name.startsWith("."))
    .sort((a, b) => a.localeCompare(b, "en"));

/**
 * `---` 로 감싼 맨 앞 frontmatter 를 `key: value` 줄 단위로 읽는다. 값의 따옴표는 벗긴다.
 * 본문이 시작하는 줄 번호(1부터)를 함께 돌려 이미지·링크 오류의 줄을 맞춘다.
 */
const parseFrontmatter = (source, file, allowedKeys, problems) => {
  const lines = source.split(/\r?\n/);
  const fields = {};
  if (lines[0]?.trim() !== "---") return { fields, body: source, bodyStartLine: 1 };
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end === -1) {
    problems.push(`${file}:1 frontmatter 가 '---' 로 닫히지 않았습니다.`);
    return { fields, body: "", bodyStartLine: lines.length + 1 };
  }
  for (let index = 1; index < end; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!match) {
      problems.push(`${file}:${index + 1} 'key: value' 형식이 아닙니다.`);
      continue;
    }
    const [, key, raw] = match;
    if (!allowedKeys.has(key)) {
      problems.push(`${file}:${index + 1} 알 수 없는 항목 '${key}' (쓸 수 있는 항목: ${[...allowedKeys].join(", ")})`);
      continue;
    }
    const value = raw.trim().replace(/^(["'])(.*)\1$/, "$2").trim();
    if (value) fields[key] = value;
  }
  return { fields, body: lines.slice(end + 1).join("\n"), bodyStartLine: end + 2 };
};

/** `/assets/...` 경로를 검사해 assets 안의 상대 경로를 돌려준다. 문제가 있으면 null. */
const resolveAsset = (target, where, root, problems, usedAssets) => {
  if (!target.startsWith("/assets/")) {
    problems.push(`${where} 이미지는 '/assets/...' 경로로 넣어야 합니다: ${target}`);
    return null;
  }
  const normalized = posix.normalize(target);
  if (!normalized.startsWith("/assets/")) {
    problems.push(`${where} assets 폴더 밖을 가리킵니다: ${target}`);
    return null;
  }
  const assetPath = normalized.slice("/assets/".length);
  if (!existsSync(join(root, "assets", assetPath))) {
    problems.push(`${where} 없는 이미지입니다: ${target}`);
    return null;
  }
  usedAssets.add(assetPath);
  return assetPath;
};

/** 레포 구조를 읽어 언어별 그룹·페이지 목록을 만든다(아직 응답 모양 아님). */
const scanLocale = (root, locale, problems) => {
  const groups = [];
  const pages = [];
  const localeDir = join(root, locale);
  if (!existsSync(localeDir)) return { groups, pages };

  const walk = (dir, parent, depth) => {
    for (const name of visibleEntries(dir)) {
      const full = join(dir, name);
      const file = toPosix(relative(root, full));
      if (statSync(full).isDirectory()) {
        if (depth >= MAX_GROUP_DEPTH) {
          problems.push(`${file} 그룹은 ${MAX_GROUP_DEPTH}단까지만 만들 수 있습니다.`);
          continue;
        }
        const slug = slugOf(name);
        if (!SLUG.test(slug)) {
          problems.push(`${file} slug '${slug}' 는 영문 소문자·숫자·하이픈만 쓸 수 있습니다.`);
          continue;
        }
        const group = { slug, file, parent, fields: {}, children: [] };
        const indexFile = join(full, "index.md");
        if (existsSync(indexFile)) {
          const indexName = `${file}/index.md`;
          group.fields = parseFrontmatter(readFileSync(indexFile, "utf8"), indexName, GROUP_KEYS, problems).fields;
          if (!group.fields.title) problems.push(`${indexName}:1 그룹 이름(title)이 없습니다.`);
          group.indexFile = indexName;
        }
        groups.push(group);
        parent?.children.push(group);
        walk(full, group, depth + 1);
        continue;
      }
      if (name === "index.md" && parent) continue;
      if (!name.endsWith(".md")) {
        problems.push(`${file} 문서 폴더에는 .md 만 둘 수 있습니다(이미지는 assets/ 에).`);
        continue;
      }
      if (!parent) {
        problems.push(`${file} 페이지는 그룹(디렉토리) 안에 있어야 합니다.`);
        continue;
      }
      const slug = slugOf(name.slice(0, -".md".length));
      if (!SLUG.test(slug)) {
        problems.push(`${file} slug '${slug}' 는 영문 소문자·숫자·하이픈만 쓸 수 있습니다.`);
        continue;
      }
      const source = readFileSync(full, "utf8");
      const parsed = parseFrontmatter(source, file, PAGE_KEYS, problems);
      if (!parsed.fields.title) problems.push(`${file}:1 페이지 제목(title)이 없습니다.`);
      const pageEntry = { slug, file, parent, ...parsed };
      pages.push(pageEntry);
      parent.children.push(pageEntry);
    }
  };
  walk(localeDir, null, 0);

  const seen = new Map();
  for (const item of [...groups, ...pages]) {
    const other = seen.get(item.slug);
    if (other) problems.push(`${item.file} slug '${item.slug}' 가 ${other} 와 겹칩니다.`);
    else seen.set(item.slug, item.file);
  }
  return { groups, pages };
};

const groupName = (group) => group.fields.title ?? group.slug;

const ancestorsOf = (group) => {
  const chain = [];
  for (let current = group; current; current = current.parent) chain.unshift(current);
  return chain;
};

const crumbsOf = (group) => ancestorsOf(group).map((each) => ({ slug: each.slug, name: groupName(each) }));

const pageCountOf = (group) =>
  group.children.reduce((count, child) => count + (child.children ? pageCountOf(child) : 1), 0);

/** 본문의 이미지는 공개 주소로, 다른 문서(.md) 링크는 사이트 주소로 바꾼다. */
const rewriteBody = (page, locale, ctx) => {
  const lines = page.body.split("\n");
  return lines
    .map((line, index) =>
      line.replace(MARKDOWN_TARGET, (whole, bang, text, target, rest) => {
        const where = `${page.file}:${page.bodyStartLine + index}`;
        if (/^(https?:|mailto:|#)/.test(target)) return whole;
        if (bang) {
          const asset = resolveAsset(target, where, ctx.root, ctx.problems, ctx.usedAssets);
          return asset ? `![${text}](${ctx.assetBase}${asset}${rest})` : whole;
        }
        const [pathPart, hash = ""] = target.split("#");
        if (!pathPart.endsWith(".md")) return whole;
        const linked = posix.normalize(posix.join(posix.dirname(page.file), pathPart));
        const slug = ctx.slugByFile.get(linked);
        if (!slug) {
          ctx.problems.push(`${where} 없는 문서로 링크합니다: ${target}`);
          return whole;
        }
        return `[${text}](${SITE_BASE}/${locale}/articles/${slug}${hash ? `#${hash}` : ""}${rest})`;
      }),
    )
    .join("\n");
};

/** 검색용 본문: 이미지·링크 주소와 마크다운 기호를 걷어낸다. */
const searchTextOf = (content) =>
  content
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const buildBundle = ({ root, assetBase }) => {
  const configFile = join(root, "docs.config.json");
  if (!existsSync(configFile)) throw new BundleError(["docs.config.json 이 없습니다."]);
  const locales = JSON.parse(readFileSync(configFile, "utf8"));
  const codes = locales.locales.map((locale) => locale.code);

  const problems = [];
  const usedAssets = new Set();
  const scanned = Object.fromEntries(codes.map((code) => [code, scanLocale(root, code, problems)]));
  const availability = (kind, slug) =>
    codes.filter((code) => scanned[code][kind].some((item) => item.slug === slug));

  const byLocale = {};
  for (const code of codes) {
    const { groups, pages } = scanned[code];
    const ctx = {
      root,
      assetBase,
      problems,
      usedAssets,
      slugByFile: new Map(pages.map((page) => [page.file, page.slug])),
    };
    const coverOf = (group) => {
      if (!group.fields.cover) return null;
      const asset = resolveAsset(group.fields.cover, `${group.indexFile}:1`, root, problems, usedAssets);
      return asset ? `${assetBase}${asset}` : null;
    };
    const groupCard = (group) => ({
      slug: group.slug,
      name: groupName(group),
      description: group.fields.description ?? null,
      coverImageUrl: coverOf(group),
      pageCount: pageCountOf(group),
    });
    const treeOf = (items) =>
      items.map((item) =>
        item.children
          ? { type: "GROUP", slug: item.slug, name: groupName(item), children: treeOf(item.children) }
          : { type: "PAGE", slug: item.slug, title: item.fields.title ?? "", children: [] },
      );

    const pagesBySlug = {};
    const search = [];
    for (const page of pages) {
      const content = rewriteBody(page, code, ctx);
      pagesBySlug[page.slug] = {
        slug: page.slug,
        title: page.fields.title ?? "",
        summary: page.fields.summary ?? null,
        content,
        groupSlug: page.parent.slug,
        breadcrumbs: crumbsOf(page.parent),
        availableLocales: availability("pages", page.slug),
      };
      search.push({
        slug: page.slug,
        title: page.fields.title ?? "",
        summary: page.fields.summary ?? null,
        groupName: groupName(page.parent),
        text: searchTextOf(content),
      });
    }

    const roots = groups.filter((group) => !group.parent);
    byLocale[code] = {
      tree: treeOf(roots),
      home: roots.map(groupCard),
      groups: Object.fromEntries(
        groups.map((group) => [
          group.slug,
          {
            ...groupCard(group),
            breadcrumbs: crumbsOf(group).slice(0, -1),
            children: group.children.map((child) =>
              child.children
                ? { type: "GROUP", ...groupCard(child) }
                : {
                    type: "PAGE",
                    slug: child.slug,
                    title: child.fields.title ?? "",
                    summary: child.fields.summary ?? null,
                  },
            ),
            availableLocales: availability("groups", group.slug),
          },
        ]),
      ),
      pages: pagesBySlug,
      search,
    };
  }

  const assetsDir = join(root, "assets");
  if (existsSync(assetsDir)) {
    const walkAssets = (dir) => {
      for (const name of visibleEntries(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) {
          walkAssets(full);
          continue;
        }
        const file = toPosix(relative(root, full));
        const extension = posix.extname(name).toLowerCase();
        if (!IMAGE_EXTENSIONS.has(extension)) {
          problems.push(`${file} 쓸 수 없는 이미지 형식입니다(${[...IMAGE_EXTENSIONS].join(", ")}).`);
        } else if (!usedAssets.has(toPosix(relative(assetsDir, full)))) {
          problems.push(`${file} 어떤 문서에서도 쓰지 않는 이미지입니다. 지워 주세요.`);
        }
      }
    };
    walkAssets(assetsDir);
  }

  if (problems.length) throw new BundleError(problems);
  return { locales, byLocale };
};

const main = () => {
  const { values } = parseArgs({
    options: {
      root: { type: "string", default: "." },
      sha: { type: "string" },
      "asset-base": { type: "string" },
      out: { type: "string" },
      check: { type: "boolean", default: false },
    },
  });
  const assetBase =
    values["asset-base"] ??
    (values.sha ? `https://raw.githubusercontent.com/${REPO}/${values.sha}/assets/` : "/assets/");
  try {
    const bundle = buildBundle({ root: values.root, assetBase });
    if (values.check || !values.out) {
      console.log("문서 규칙 검사 통과");
      return;
    }
    mkdirSync(values.out, { recursive: true });
    writeFileSync(join(values.out, "locales.json"), JSON.stringify(bundle.locales));
    for (const [code, data] of Object.entries(bundle.byLocale)) {
      writeFileSync(join(values.out, `${code}.json`), JSON.stringify(data));
    }
    console.log(`묶음 생성: ${values.out}`);
  } catch (error) {
    if (!(error instanceof BundleError)) throw error;
    console.error(error.message);
    process.exitCode = 1;
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
