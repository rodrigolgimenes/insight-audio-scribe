
import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader } from "lucide-react"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg"
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8"
    }

    return (
      <div
        ref={ref}
        className={cn("animate-spin text-muted-foreground", className)}
        {...props}
      >
        <Loader className={sizeClasses[size]} />
        <span className="sr-only">Loading</span>
      </div>
    )
  }
)

Spinner.displayName = "Spinner"

export { Spinner }
