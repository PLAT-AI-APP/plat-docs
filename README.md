# PLAT 문서

[plat.so/docs](https://plat.so/docs) 에 보이는 이용 가이드의 원본입니다. 사이트(plat-fe)는 이 레포에서 만든 묶음을 읽어 보여 주기만 합니다.

| 브랜치 | 보이는 곳 |
| --- | --- |
| `develop` | 개발 서버 |
| `main` | 운영 서버 |

## 고치는 흐름

1. 운영자는 [이슈](../../issues/new/choose)의 **문서 수정 요청** 양식으로 요청합니다.
2. 개발자는 `develop` 에서 브랜치를 따서 고치고 `develop` 으로 PR 을 올립니다. `main`·`develop` 에는 직접 push 할 수 없습니다.
3. PR 의 `check` 가 통과해야 머지할 수 있습니다. 머지하면 몇 분 안에 개발 서버에 반영됩니다.
4. 개발 서버에서 확인했으면 `develop` → `main` PR 을 **Create a merge commit** 으로 머지합니다. 운영 서버에 반영됩니다.

반영은 GitHub 캐시 때문에 최대 5분 남짓 걸립니다. 검사에 실패한 내용은 올라가지 않고, 사이트는 마지막 정상본을 계속 보여 줍니다.

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

- **순서**: 파일명 순입니다. 앞의 `01-` 같은 숫자는 정렬용이라 주소에는 들어가지 않습니다. (`01-welcome.md` → `/docs/ko/articles/welcome`)
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
