"use client";

import { type ImgHTMLAttributes, type ReactNode, type SyntheticEvent, useState } from "react";

type FallbackImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  /** 이미지를 받지 못했을 때 대신 그릴 것. 없으면 같은 크기의 빈 칸을 둔다. */
  fallback?: ReactNode;
};

/**
 * 받지 못하면 깨진 이미지 대신 fallback 을 그리는 img.
 * plat-fe 는 마스코트 그림을 그리지만, 문서 사이트는 썸네일 자리의 아이콘(fallback)으로 충분하다.
 */
const FallbackImg = ({ src, alt, className, style, onError, fallback, ...props }: FallbackImgProps) => {
  // 실패한 src 를 기억해 두면 src 가 바뀌었을 때 따로 되돌리지 않아도 된다.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === src) {
    return fallback ?? <span aria-hidden="true" className={className} style={style} />;
  }

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    setFailedSrc(src);
    onError?.(event);
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} src={src} alt={alt} className={className} style={style} onError={handleError} />
  );
};

export default FallbackImg;
