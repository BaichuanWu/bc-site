import * as React from "react"
import { toast } from "sonner"

type AsyncActionOptions<T> = {
  successMessage?: string
  errorMessage?: string
  onSuccess?: (result: T) => void | Promise<void>
  onError?: (error: unknown) => void | Promise<void>
}

export function useAsyncAction() {
  const [isLoading, setIsLoading] = React.useState(false)

  const run = React.useCallback(
    async <T>(action: () => Promise<T>, options: AsyncActionOptions<T> = {}) => {
      try {
        setIsLoading(true)
        const result = await action()

        if (options.successMessage) {
          toast.success(options.successMessage)
        }
        if (options.onSuccess) {
          await options.onSuccess(result)
        }

        return result
      } catch (error) {
        if (options.errorMessage) {
          toast.error(options.errorMessage)
        }
        if (options.onError) {
          await options.onError(error)
        }
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    isLoading,
    run,
  }
}
