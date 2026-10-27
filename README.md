# PLAT 문서

PLAT 이용 가이드의 원본과, 그것을 보여 주는 문서 사이트(`site/`)가 함께 있는 레포입니다. 문서 사이트는 PLAT 앱(plat-fe)과 따로 배포됩니다.

| 브랜치 | 문서 사이트 | 호스팅 |
| --- | --- | --- |
| `develop` | [docs-dev.plat.so](https://docs-dev.plat.so) | Vercel |
| `main` | [docs.plat.so](https://docs.plat.so) | Firebase App Hosting |

> 옮기는 동안에는 앱 안의 예전 문서 화면(`plat.so/docs`)도 `publish` 워크플로가 만든 묶음(`bundle` 브랜치)을 계속 읽습니다. 앱의 문서 링크를 새 사이트로 바꾸고 나면 `publish` 워크플로와 `bundle` 브랜치는 지웁니다.

## 고치는 흐름

1. 운영자는 [이슈](../../issues/new/choose)의 **문서 수정 요청** 양식으로 요청합니다.
2. 개발자는 `develop` 에서 브랜치를 따서 고치고 `develop` 으로 PR 을 올립니다. `main`·`develop` 에는 직접 push 할 수 없습니다.
3. PR 의 `check` 가 통과해야 머지할 수 있습니다. `check` 는 문서 규칙 검사와 문서 사이트 빌드를 함께 봅니다. 머지하면 Vercel 이 다시 빌드해 몇 분 안에 개발 사이트에 반영됩니다.
4. 개발 사이트에서 확인했으면 `develop` → `main` PR 을 **Create a merge commit** 으로 머지합니다. Firebase App Hosting 이 다시 빌드해 운영 사이트에 반영됩니다.

문서는 빌드할 때 사이트에 함께 들어갑니다. 규칙에 어긋난 문서가 있으면 빌드가 실패해 배포되지 않고, 사이트는 마지막 정상본을 계속 보여 줍니다.

## 작성 규칙

```
docs.config.json        지원 언어. 배열 순서가 언어 메뉴 순서
ko/                     한국어 문서
  01-start/             그룹 (디렉토리)
    index.md            그룹 정보 (선택)
    01-welcome.md       페이지
    02-account/         하위 그룹 (최대 3단)
en/                     영어 문서. ko 와 같은 경로·같은 파일명
assets/                 모든 이미지
```

- **순서**: 파일명 순입니다. 앞의 `01-` 같은 숫자는 정렬용이라 주소에는 들어가지 않습니다. (`01-welcome.md` → `docs.plat.so/ko/articles/welcome`)
- **이름(slug)**: 영문 소문자·숫자·하이픈만 씁니다. 한 언어 안에서 그룹·페이지 이름이 겹치면 안 됩니다.
- **언어**: 같은 문서는 언어마다 같은 경로·같은 파일명으로 둡니다. 한쪽 언어에만 있으면 다른 언어 사이트에서는 "다른 언어로 보기" 안내가 나옵니다.
- **페이지**: 그룹 안에만 둘 수 있습니다. 맨 위에 frontmatter 를 씁니다.

  ```md
  ---
  title: 가입하기
  summary: 계정을 만드는 방법   # 선택. 목록·검색에 보임
  ---

  ## 본문
  ```

- **그룹 정보**: 디렉토리의 `index.md` 에 씁니다. 없으면 디렉토리 이름을 그대로 씁니다.

  ```md
  ---
  title: 시작하기
  description: 처음 오셨나요?      # 선택
  cover: /assets/start-cover.png   # 선택. 홈 카드 이미지
  ---
  ```

- **이미지**: `assets/` 에 넣고 `![설명](/assets/파일.png)` 로 씁니다. png·jpg·jpeg·gif·webp 만 됩니다. 어디서도 쓰지 않는 이미지는 검사에서 걸리니 문서에서 뺄 때 같이 지웁니다.
- **문서 링크**: 다른 문서는 파일 경로로 겁니다. `[환불 안내](../02-payment/01-refund.md)` → 사이트 주소로 바뀝니다.

## 로컬에서 검사

Node 24 만 있으면 됩니다(설치할 패키지 없음).

```bash
node scripts/build-bundle.mjs --check
```

```bash
node --test "scripts/*.test.mjs"
```

## 문서 사이트(site/)

Next.js 앱입니다. 화면 코드는 plat-fe 의 문서 화면(`/docs`)을 옮겨 온 것이라 디자인 토큰·아이콘을 고칠 때는 앱과 함께 맞춥니다.

```
site/
  scripts/prepare-content.mjs   빌드 직전에 ko/·en/ 를 검사·묶음으로 만들어 src/generated/ 에 쓰고, assets/ 를 public/assets/ 로 복사
  src/app/                      화면 (홈 · 그룹 · 문서 · 검색 · 검색 자동완성)
  src/components/docs/          헤더 · 트리 · 목차 · 검색창 · 언어 메뉴 등
  apphosting.yaml               Firebase App Hosting 설정(운영)
```

문서 바꾼 결과를 화면으로 보려면 `site/` 에서 실행합니다(문서를 고칠 때마다 다시 실행).

```bash
npm --prefix site install
```

```bash
npm --prefix site run dev
```

### 배포 설정

| | 개발 (Vercel) | 운영 (Firebase App Hosting) |
| --- | --- | --- |
| 브랜치 | `develop` | `main` |
| 앱 루트 | Root Directory = `site` | 앱 루트 디렉터리 = `site` |
| 환경 변수 | 프로젝트 설정에 넣음 | `site/apphosting.yaml` |
| `NEXT_PUBLIC_SITE_URL` | `https://docs-dev.plat.so` | `https://docs.plat.so` |
| `NEXT_PUBLIC_APP_URL` | `https://dev.plat.so` | `https://plat.so` |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `false` | 클로즈베타 동안 `false` |

- 빌드는 레포 전체(`ko/`, `en/`, `assets/`, `scripts/`)를 읽으므로, 앱 루트 밖 파일을 빌드에 포함하는 설정을 켜 둡니다(Vercel 기본값).
- 도메인은 각 호스팅에 추가한 뒤, 안내하는 CNAME 을 `plat.so` DNS(Route 53)에 넣습니다.
