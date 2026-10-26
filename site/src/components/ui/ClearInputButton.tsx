"use client";

import { Close } from "@/icons";
import { cn } from "@/lib/utils";

interface ClearInputButtonProps {
  onClear: () => void;
  /** 화면에 보이지 않는 버튼 이름(스크린리더). 문서 화면 문구에서 넘긴다. */
  label: string;
  /** 값이 없을 때는 자리만 지키고 숨긴다(레이아웃이 흔들리지 않게). */
  visible?: boolean;
  className?: string;
}

/**
 * 입력 칸 오른쪽의 동그라미 X 지우기 버튼(plat-fe 의 같은 버튼에서 앱 번역만 뺐다).
 * 진짜 <button> 이라 Tab 으로 닿고 Enter·Space 로도 지운다.
 * 누를 때 입력 칸의 포커스를 뺏지 않는다.
 */
const ClearInputButton = ({ onClear, label, visible = true, className }: ClearInputButtonProps) => (
  <button
    type="button"
    aria-label={label}
    tabIndex={visible ? 0 : -1}
    aria-hidden={visible ? undefined : true}
    onMouseDown={(event) => event.preventDefault()}
    onClick={(event) => {
      // 지우고 나면 버튼은 사라진다. 포커스를 같은 칸의 입력으로 돌려 바로 다시 쓰게 한다.
      const field = event.currentTarget.parentElement?.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >("input, textarea");
      onClear();
      field?.focus();
    }}
    className={cn(
      "flex size-5 shrink-0 items-center justify-center rounded-full bg-font-2/40 text-dark transition hover:bg-font-2/70",
      !visible && "pointer-events-none opacity-0",
      className,
    )}
  >
    <Close className="size-2.5" aria-hidden="true" />
  </button>
);

export default ClearInputButton;
