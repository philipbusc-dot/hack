import type { LucideIcon } from "lucide-react";

interface ResponsiveIconProps {
  icon: LucideIcon;
  smSize: number;
  mdSize: number;
  smStrokeWidth?: number;
  mdStrokeWidth?: number;
  fill?: string;
  strokeWidth?: number;
}

/**
 * Renders a Lucide icon at two different sizes based on viewport breakpoint.
 * Avoids duplicating the block/md:hidden + hidden/md:block pattern everywhere.
 */
const ResponsiveIcon = ({
  icon: Icon,
  smSize,
  mdSize,
  smStrokeWidth,
  mdStrokeWidth,
  fill,
  strokeWidth,
}: ResponsiveIconProps) => (
  <>
    <span className="block md:hidden">
      <Icon size={smSize} fill={fill} strokeWidth={smStrokeWidth ?? strokeWidth ?? 2} />
    </span>
    <span className="hidden md:block">
      <Icon size={mdSize} fill={fill} strokeWidth={mdStrokeWidth ?? strokeWidth ?? 2} />
    </span>
  </>
);

export default ResponsiveIcon;
