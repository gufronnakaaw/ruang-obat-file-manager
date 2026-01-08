import React from "react";

interface LogoRuangObatProps extends React.SVGProps<SVGSVGElement> {}

export const LogoRuangObat: React.FC<LogoRuangObatProps> = (props) => {
  return (
    <svg
      aria-hidden="true"
      width="1230"
      height="1158"
      viewBox="0 0 1230 1158"
      role="presentation"
      focusable="false"
      fill="none"
      {...props}
    >
      <path
        d="M716.11 771.465H510.894H507.898L820.966 1084.5H1029.18L716.11 771.465Z"
        fill="currentColor"
      />
      <path
        d="M521.379 72H140.905H130.419L278.714 220.281H552.836V486.886L726.596 660.629H994.725V922.742L1158 1086V707.061L963.269 512.349H716.11V266.712L521.379 72Z"
        fill="#6238C3"
      />
      <path
        d="M233.777 286.183L72 124.422V778.954L233.777 940.715V701.069H651.699L501.906 551.291H233.777V286.183Z"
        fill="currentColor"
      />
    </svg>
  );
};
