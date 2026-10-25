import { cn } from "@/lib/utils";
import { FolderIcon } from "./DocsIcons";
import FallbackImg from "@/components/image/FallbackImg";

/**
 * 카테고리 썸네일·커버. 커버 이미지가 없으면 연한 브랜드 바탕에 폴더 아이콘을 둔다.
 * 문서 레포 assets/ 의 이미지라 크기를 미리 알 수 없어 next/image 대신 img 를 쓴다.
 */
const DocsThumbnail = ({
  src,
  alt,
  className,
  iconSize = 40,
  eager = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  iconSize?: number;
  eager?: boolean;
}) => (
  <div
    className={cn(
      "flex items-center justify-center overflow-hidden rounded-xl bg-brand-opacity text-brand",
      className,
    )}
  >
    {src ? (
      <FallbackImg
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        className="size-full object-cover"
        fallback={<FolderIcon size={iconSize} aria-hidden="true" />}
      />
    ) : (
      <FolderIcon size={iconSize} aria-hidden="true" />
    )}
  </div>
);

export default DocsThumbnail;
