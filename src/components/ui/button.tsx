import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cta: "bg-accent text-accent-foreground font-semibold border border-accent/60 shadow-[0_10px_28px_-10px_hsl(20_48%_42%/0.55),0_2px_0_0_hsl(20_48%_30%/0.5),inset_0_1px_0_0_hsl(0_0%_100%/0.18)] hover:bg-accent/95 hover:-translate-y-[1px] hover:shadow-[0_16px_36px_-12px_hsl(20_48%_42%/0.65),0_2px_0_0_hsl(20_48%_30%/0.55),inset_0_1px_0_0_hsl(0_0%_100%/0.2)] active:shadow-[0_4px_10px_-4px_hsl(20_48%_42%/0.45),inset_0_1px_0_0_hsl(0_0%_100%/0.1)]",
        "cta-dark": "bg-foreground text-background font-semibold border border-foreground shadow-[0_10px_28px_-10px_hsl(15_11%_11%/0.55),0_2px_0_0_hsl(15_11%_5%/0.6),inset_0_1px_0_0_hsl(0_0%_100%/0.1)] hover:bg-foreground/92 hover:-translate-y-[1px] hover:shadow-[0_16px_36px_-12px_hsl(15_11%_11%/0.7),0_2px_0_0_hsl(15_11%_5%/0.65),inset_0_1px_0_0_hsl(0_0%_100%/0.12)] active:shadow-[0_4px_10px_-4px_hsl(15_11%_11%/0.5)]",
        "cta-burgundy": "bg-primary text-primary-foreground font-semibold border border-primary shadow-[0_10px_28px_-10px_hsl(337_74%_17%/0.55),0_2px_0_0_hsl(337_74%_10%/0.55),inset_0_1px_0_0_hsl(0_0%_100%/0.08)] hover:bg-primary/92 hover:-translate-y-[1px] hover:shadow-[0_16px_36px_-12px_hsl(337_74%_17%/0.7),0_2px_0_0_hsl(337_74%_10%/0.6),inset_0_1px_0_0_hsl(0_0%_100%/0.1)] active:shadow-[0_4px_10px_-4px_hsl(337_74%_17%/0.5)]",
        "cta-outline": "border border-accent bg-transparent text-accent hover:bg-accent hover:text-accent-foreground shadow-[0_2px_8px_-2px_hsl(20_48%_42%/0.2)] hover:-translate-y-[1px] hover:shadow-[0_8px_18px_-6px_hsl(20_48%_42%/0.35)]",
        "ghost-cream": "bg-transparent text-background border border-background/30 hover:bg-background/10 hover:border-background/50",
        "header-ghost": "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10",
        "header-active": "bg-primary-foreground/15 text-primary-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[4px] px-3",
        lg: "h-12 rounded-[4px] px-8 text-base",
        xl: "h-14 rounded-[4px] px-10 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
