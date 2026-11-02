/*
 * 배포마다 달라지는 주소·설정. Vercel(develop → docs-dev.plat.so)과 Firebase App Hosting(main → docs.plat.so)의
 * 환경 변수로 정하고, 없으면 운영 값을 쓴다. NEXT_PUBLIC_ 값은 빌드 때 화면 코드에 박히므로 바꾸면 다시 빌드해야 한다.
 */

/** 문서 사이트 기준 주소. canonical · hreflang · 공유 미리보기(OG)의 상대 경로가 이 주소로 풀린다. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.plat.so";

/** 헤더 로고("PLAT 바로가기")가 여는 PLAT 앱 주소. 개발 배포는 dev.plat.so 로 둔다. */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://plat.so";

/** 검색 엔진 수집 허용 여부. 클로즈베타 동안은 막아 두고, 정식 출시 때 배포 env 에 "true" 를 넣어 연다(plat-fe 와 같다). */
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

/**
 * 탭 제목 앞에 붙이는 환경 표시. 개발 문서(docs-dev)를 운영과 한눈에 가르려는 것이다(plat-fe 와 같다).
 * 개발 배포에만 NEXT_PUBLIC_APP_ENV=dev 를 넣는다. 없으면 운영으로 보고 아무것도 붙이지 않는다.
 */
const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV;

export const TITLE_PREFIX = APP_ENV === "dev" || APP_ENV === "local" ? `${APP_ENV}: ` : "";
