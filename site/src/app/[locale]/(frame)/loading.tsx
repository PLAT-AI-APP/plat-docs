import DocsLoading from "@/components/docs/DocsLoading";

// 이 파일이 없으면 문서 링크를 누른 뒤 서버 응답이 올 때까지 이전 문서가 그대로 멈춰 있다.
// 경계가 있으면 링크 prefetch 가 이 자리까지 미리 받아 두어 누르는 즉시 화면이 바뀐다.
export default function Loading() {
  return <DocsLoading />;
}
