/**
 * 문서 사이트(/docs) 데이터 타입. 원본은 PLAT-AI-APP/plat-docs 레포이고, 그 레포의
 * scripts/build-bundle.mjs 가 만든 묶음(locales.json · <locale>.json)과 모양이 같다.
 * 그룹·페이지는 slug 로 가리킨다(한 언어 안에서 유일, 언어끼리는 같은 문서면 같은 slug).
 */

/**
 * 문서 언어 코드(`ko` · `en` …). 어떤 언어가 있는지는 문서 레포의 docs.config.json 이 정한다 —
 * 사이트는 언어 목록을 들고 있지 않는다. 화면 문구(헤더 · 버튼)만 사이트가 언어별로 갖는다.
 */
export type DocsLocale = string;

export interface DocsLocaleInfo {
  code: DocsLocale;
  /** 그 언어로 적은 이름(한국어 · English). 언어 메뉴에 그대로 쓴다. */
  name: string;
}

/** locales.json. `locales` 순서가 언어 메뉴 순서다. */
export interface DocsLocalesResponse {
  defaultLocale: DocsLocale;
  locales: DocsLocaleInfo[];
}

/** 왼쪽 트리 노드. GROUP 은 name, PAGE 는 title 을 쓴다. */
export interface DocsTreeNode {
  type: "GROUP" | "PAGE";
  slug: string;
  name?: string | null;
  title?: string | null;
  children: DocsTreeNode[];
}

export interface DocsTreeResponse {
  items: DocsTreeNode[];
}

export interface DocsHomeGroup {
  slug: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  pageCount: number;
}

export interface DocsHomeResponse {
  groups: DocsHomeGroup[];
}

export interface DocsBreadcrumb {
  slug: string;
  name: string;
}

export type DocsGroupChild =
  | {
      type: "GROUP";
      slug: string;
      name: string;
      description: string | null;
      coverImageUrl: string | null;
      pageCount: number;
    }
  | {
      type: "PAGE";
      slug: string;
      title: string;
      summary: string | null;
    };

export interface DocsGroupResponse {
  slug: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  breadcrumbs: DocsBreadcrumb[];
  children: DocsGroupChild[];
  availableLocales: DocsLocale[];
}

export interface DocsPageResponse {
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  groupSlug: string;
  breadcrumbs: DocsBreadcrumb[];
  availableLocales: DocsLocale[];
}

export interface DocsSearchItem {
  slug: string;
  title: string;
  summary: string | null;
  groupName: string;
}

export interface DocsSearchResponse {
  items: DocsSearchItem[];
}

/** 검색어는 앞뒤 공백을 뺀 뒤 1~50자. */
export const DOCS_SEARCH_MAX_LENGTH = 50;

/** 묶음의 검색 항목. 화면에 내보내는 DocsSearchItem 에 본문(text)을 더한 것. */
export interface DocsSearchEntry extends DocsSearchItem {
  text: string;
}

/** <locale>.json — 한 언어의 문서 전체. */
export interface DocsLocaleBundle {
  tree: DocsTreeNode[];
  home: DocsHomeGroup[];
  groups: Record<string, DocsGroupResponse>;
  pages: Record<string, DocsPageResponse>;
  search: DocsSearchEntry[];
}
