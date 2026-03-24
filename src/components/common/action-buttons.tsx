import * as React from "react"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"

interface ActionButtonsProps {
  onEdit: () => void;
  onConfirmDelete: () => Promise<void>;
  title?: string;
  description: React.ReactNode;
}

export function ActionButtons({ onEdit, onConfirmDelete, title, description }: ActionButtonsProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirmDelete()
      setIsConfirmOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex gap-1 w-[80px]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setIsConfirmOpen(true)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        title={title}
        description={description}
        isDeleting={isDeleting}
      />
    </>
  )
}
