import type { HTMLAttributes } from "react";

type DashboardPanelProps = HTMLAttributes<HTMLDivElement>;

export default function DashboardPanel({
  children,
  className = "",
  ...props
}: DashboardPanelProps) {
  return (
    <div
      {...props}
      className={`dashboard-surface rounded-[24px] dashboard-surface-hover ${className}`}
    >
      {children}
    </div>
  );
}
