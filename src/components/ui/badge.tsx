import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300",
        secondary: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
        accent: "bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-300",
        success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
        outline: "border border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
