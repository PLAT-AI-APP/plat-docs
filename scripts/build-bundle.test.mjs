import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { BundleError, buildBundle } from "./build-bundle.mjs";

const CONFIG = JSON.stringify({
  defaultLocale: "ko",
  locales: [
    { code: "ko", name: "한국어" },
    { code: "en", name: "English" },
  ],
});

const ASSET_BASE = "https://cdn.test/sha/assets/";

/** { "상대경로": "내용" } 으로 임시 레포를 만든다. 이미지 내용은 아무 바이트면 된다. */
const makeRepo = (files) => {
  const root = mkdtempSync(join(tmpdir(), "plat-docs-"));
  for (const [path, content] of Object.entries({ "docs.config.json": CONFIG, ...files })) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
};

const page = (title, body = "", extra = "") => `---\ntitle: ${title}\n${extra}---\n\n${body}`;

const errorsOf = (files) => {
  try {
    buildBundle({ root: makeRepo(files), assetBase: ASSET_BASE });
  } catch (error) {
    assert.ok(error instanceof BundleError, `BundleError 가 아님: ${error}`);
    return error.problems;
  }
  assert.fail("오류 없이 끝났다");
};

const VALID = {
  "ko/02-payment/index.md": "---\ntitle: 결제\n---\n",
  "ko/02-payment/01-refund.md": page("환불", "환불 안내"),
  "ko/01-start/index.md": "---\ntitle: 시작하기\ndescription: 처음 오셨나요\ncover: /assets/cover.png\n---\n",
  "ko/01-start/02-signup.md": page(
    "가입하기",
    "## 가입\n\n![화면](/assets/signup.png)\n\n[환불 보기](../02-payment/01-refund.md)",
    "summary: 계정 만들기\n",
  ),
  "ko/01-start/01-welcome.md": page("환영합니다"),
  "ko/01-start/03-account/04-withdraw.md": page("탈퇴"),
  "en/01-start/index.md": "---\ntitle: Getting started\n---\n",
  "en/01-start/02-signup.md": page("Sign up"),
  "assets/cover.png": "x",
  "assets/signup.png": "x",
};

test("디렉토리는 그룹, md 는 페이지가 되고 파일명 순으로 정렬되며 NN- 접두어는 slug 에서 빠진다", () => {
  const { byLocale } = buildBundle({ root: makeRepo(VALID), assetBase: ASSET_BASE });
  const ko = byLocale.ko;
  assert.deepEqual(
    ko.tree.map((node) => node.slug),
    ["start", "payment"],
  );
  assert.deepEqual(
    ko.tree[0].children.map((node) => [node.type, node.slug]),
    [
      ["PAGE", "welcome"],
      ["PAGE", "signup"],
      ["GROUP", "account"],
    ],
  );
  assert.equal(ko.tree[0].name, "시작하기");
  assert.equal(ko.tree[0].children[1].title, "가입하기");
});

test("홈은 최상위 그룹과 하위까지 센 페이지 수를 담는다", () => {
  const { byLocale } = buildBundle({ root: makeRepo(VALID), assetBase: ASSET_BASE });
  assert.deepEqual(byLocale.ko.home[0], {
    slug: "start",
    name: "시작하기",
    description: "처음 오셨나요",
    coverImageUrl: `${ASSET_BASE}cover.png`,
    pageCount: 3,
  });
});

test("페이지는 본문 이미지·문서 링크를 사이트 주소로 바꾸고 상위 그룹 경로를 담는다", () => {
  const { byLocale } = buildBundle({ root: makeRepo(VALID), assetBase: ASSET_BASE });
  const signup = byLocale.ko.pages.signup;
  assert.equal(signup.summary, "계정 만들기");
  assert.match(signup.content, /!\[화면\]\(https:\/\/cdn\.test\/sha\/assets\/signup\.png\)/);
  assert.match(signup.content, /\[환불 보기\]\(\/docs\/ko\/articles\/refund\)/);
  assert.equal(signup.groupSlug, "start");
  assert.deepEqual(signup.breadcrumbs, [{ slug: "start", name: "시작하기" }]);
  assert.deepEqual(byLocale.ko.pages.withdraw.breadcrumbs.map((crumb) => crumb.slug), [
    "start",
    "account",
  ]);
});

test("index.md 가 없는 그룹은 디렉토리 slug 를 이름으로 쓴다", () => {
  const { byLocale } = buildBundle({ root: makeRepo(VALID), assetBase: ASSET_BASE });
  assert.equal(byLocale.ko.groups.account.name, "account");
  assert.deepEqual(byLocale.ko.groups.account.breadcrumbs, [{ slug: "start", name: "시작하기" }]);
});

test("availableLocales 는 같은 slug 가 있는 언어만 담는다", () => {
  const { byLocale } = buildBundle({ root: makeRepo(VALID), assetBase: ASSET_BASE });
  assert.deepEqual(byLocale.ko.pages.signup.availableLocales, ["ko", "en"]);
  assert.deepEqual(byLocale.ko.pages.refund.availableLocales, ["ko"]);
  assert.deepEqual(byLocale.en.groups.start.availableLocales, ["ko", "en"]);
});

test("검색 항목은 페이지마다 제목·요약·그룹 이름·본문을 담는다", () => {
  const { byLocale } = buildBundle({ root: makeRepo(VALID), assetBase: ASSET_BASE });
  const entry = byLocale.ko.search.find((item) => item.slug === "signup");
  assert.equal(entry.groupName, "시작하기");
  assert.match(entry.text, /가입/);
  assert.doesNotMatch(entry.text, /assets/);
});

test("언어 폴더가 비어 있어도 빈 묶음이 된다", () => {
  const { locales, byLocale } = buildBundle({ root: makeRepo({}), assetBase: ASSET_BASE });
  assert.equal(locales.defaultLocale, "ko");
  assert.deepEqual(byLocale.en, { tree: [], home: [], groups: {}, pages: {}, search: [] });
});

test("규칙을 어기면 파일:줄과 함께 한 번에 모아 실패한다", () => {
  const problems = errorsOf({
    "ko/01-a/01-no-title.md": "---\nsummary: x\n---\n",
    "ko/01-a/02-missing-image.md": page("x", "\n![](/assets/none.png)"),
    "ko/01-a/03-escape.md": page("x", "![](/assets/../docs.config.json)"),
    "ko/01-a/04-relative-image.md": page("x", "![](./a.png)"),
    "ko/01-a/가입.md": page("x"),
    "ko/01-a/my page.md": page("x"),
    "ko/01-a/05-typo.md": page("x", "", "updated: 2026-10-19\n"),
    "ko/01-a/06-broken-link.md": page("x", "[x](./nope.md)"),
    "ko/02-b/01-dup.md": page("x"),
    "ko/03-c/01-dup.md": page("x"),
    "ko/04-d/e/f/g/01-deep.md": page("x"),
    "ko/01-root-page.md": page("x"),
    "ko/01-a/notes.txt": "x",
    "assets/unused.png": "x",
    "assets/vector.svg": "x",
  });
  const has = (pattern) =>
    assert.ok(
      problems.some((problem) => pattern.test(problem)),
      `${pattern} 가 없음:\n${problems.join("\n")}`,
    );
  has(/ko\/01-a\/01-no-title\.md:1 .*title/);
  has(/ko\/01-a\/02-missing-image\.md:6 .*\/assets\/none\.png/);
  has(/ko\/01-a\/03-escape\.md:5 .*assets/);
  has(/ko\/01-a\/04-relative-image\.md:5 .*\/assets\//);
  has(/ko\/01-a\/가입\.md .*slug/);
  has(/ko\/01-a\/my page\.md .*slug/);
  has(/ko\/01-a\/05-typo\.md:3 .*updated/);
  has(/ko\/01-a\/06-broken-link\.md:5 .*nope\.md/);
  has(/ko\/03-c\/01-dup\.md .*dup.*ko\/02-b\/01-dup\.md/);
  has(/ko\/04-d\/e\/f\/g .*3단/);
  has(/ko\/01-root-page\.md .*그룹/);
  has(/ko\/01-a\/notes\.txt .*\.md/);
  has(/assets\/unused\.png .*쓰지 않/);
  has(/assets\/vector\.svg .*형식/);
});

test("docs.config.json 이 없으면 실패한다", () => {
  const root = mkdtempSync(join(tmpdir(), "plat-docs-"));
  assert.throws(() => buildBundle({ root, assetBase: ASSET_BASE }), /docs\.config\.json/);
});
