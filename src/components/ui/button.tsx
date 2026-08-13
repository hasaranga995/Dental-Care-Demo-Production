import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        accent:
          "bg-brand-teal text-white shadow-sm hover:bg-brand-teal/90",
        outline:
          "border-primary bg-transparent text-primary hover:bg-secondary aria-expanded:bg-secondary",
        "outline-accent":
          "border-brand-teal bg-transparent text-brand-teal hover:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary",
        ghost:
          "font-medium hover:bg-secondary hover:text-foreground aria-expanded:bg-secondary dark:hover:bg-muted/50",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30",
        link: "font-medium text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-6 py-3",
        xs: "h-7 gap-1 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-lg px-4 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 py-3 text-base",
        icon: "size-11",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  nativeButton,
  render,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      render={render}
      // When `render` swaps the underlying element (e.g. a Next.js <Link> or
      // an <a> tag), it is no longer a native <button>, so Base UI's default
      // button semantics/keyboard handling must be disabled to avoid warnings
      // and incorrect a11y behavior.
      nativeButton={nativeButton ?? !render}
      {...props}
    />
  )
}

export { Button, buttonVariants }
