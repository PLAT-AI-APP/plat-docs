#!/usr/bin/env node
/*
 * 빌드·개발 서버 직전에 레포의 문서를 사이트가 읽을 모양으로 준비한다(`npm run content`).
 *
 * 1. 레포의 scripts/build-bundle.mjs 로 문서 규칙을 검사하고 묶음을 만들어 src/generated/content.json 에 쓴다.
 *    규칙에 어긋난 문서가 있으면 여기서 멈춰 빌드가 실패한다(깨진 문서는 배포되지 않는다).
 * 2. 레포의 assets/ 를 public/assets/ 로 복사한다. 본문 이미지는 `/assets/...` 주소로 이 사이트에서 바로 나간다.
 *
 * 두 결과물 모두 빌드할 때마다 새로 만드는 것이라 커밋하지 않는다(.gitignore).
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BundleError, buildBundle } from "../../scripts/build-bundle.mjs";

const siteDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(siteDir, "..");
const outFile = join(siteDir, "src", "generated", "content.json");
const assetsSrc = join(repoRoot, "assets");
const assetsOut = join(siteDir, "public", "assets");

let bundle;
try {
  bundle = buildBundle({ root: repoRoot, assetBase: "/assets/" });
} catch (error) {
  if (!(error instanceof BundleError)) throw error;
  console.error(error.message);
  process.exit(1);
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(bundle));

rmSync(assetsOut, { recursive: true, force: true });
if (existsSync(assetsSrc)) cpSync(assetsSrc, assetsOut, { recursive: true });

const pageCount = Object.values(bundle.byLocale).reduce((sum, each) => sum + Object.keys(each.pages).length, 0);
console.log(`문서 준비 완료: 언어 ${bundle.locales.locales.length}개, 페이지 ${pageCount}개`);
