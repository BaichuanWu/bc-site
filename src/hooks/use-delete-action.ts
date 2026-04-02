import * as React from "react"
import { toast } from "sonner"

import { apiClient } from "@/lib/api"

type DeleteActionOptions = {
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void | Promise<void>
}

export function useDeleteAction() {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const remove = React.useCallback(
    async (
      endpoint: string,
      id: string | number,
      options: DeleteActionOptions = {}
    ) => {
      try {
        setIsDeleting(true)
        await apiClient.delete(endpoint, { params: { id } })
        if (options.successMessage) {
          toast.success(options.successMessage)
        }
        if (options.onSuccess) {
          await options.onSuccess()
        }
      } catch (error) {
        toast.error(options.errorMessage || "Failed to delete record")
        throw error
      } finally {
        setIsDeleting(false)
      }
    },
    []
  )

  return {
    isDeleting,
    remove,
  }
}
