import { cn } from "@/lib/utils";

type GlassProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

export function Glass({ className, ...props }: GlassProps) {
  return (
    <div
      className={cn(
        "bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg shadow-glow",
        className,
      )}
      {...props}
    />
  );
}
