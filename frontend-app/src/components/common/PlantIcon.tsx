import React from "react";

interface PlantIconProps {
  size?: number;
  className?: string;
  title?: string;
}

export const PlantIcon: React.FC<PlantIconProps> = ({
  size = 24,
  className,
  title,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
    >
      {title ? <title>{title}</title> : null}
      <path d="M47 63C47 43 34 27 14 22C16 45 28 60 47 63Z" />
      <path d="M58 50C77 47 89 33 91 10C71 10 61 23 52 35C55 39 57 44 58 50Z" />
      <rect x="45" y="63" width="10" height="31" rx="3" />
    </svg>
  );
};
