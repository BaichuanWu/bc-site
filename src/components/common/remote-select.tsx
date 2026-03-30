import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { apiClient } from "@/lib/api"
import useSWR from "swr"

interface RemoteSelectProps {
  endpoint: string;
  value?: string | number | null;
  onValueChange: (value: any) => void;
  placeholder?: string;
  labelKey?: string;
  valueKey?: string;
  extraOptions?: { label: string; value: string | number }[];
  className?: string;
  disabled?: boolean;
}

/**
 * A reusable Searchable Select (Combobox) component that fetches its options from a remote API.
 * Optimized with SWR for caching and automatic revalidation. Returns the raw valueKey (like numeric IDs).
 */
export function RemoteSelect({
  endpoint,
  value,
  onValueChange,
  placeholder = "Select an option",
  labelKey = "name",
  valueKey = "id",
  extraOptions = [],
  className,
  disabled = false,
}: RemoteSelectProps) {
  const [open, setOpen] = React.useState(false)

  const { data, isLoading } = useSWR(endpoint, (url) => 
    apiClient.get(url).then((res: any) => {
      // Axios interceptor already unwrapped `response.data`.
      if (Array.isArray(res)) return res;
      return res?.dataSource || res?.data || [];
    })
  )

  const options = React.useMemo(() => {
    const remoteOptions = (data || []).map((item: any) => ({
      label: String(item[labelKey] ?? ""),
      value: item[valueKey], // keep original type (e.g. numeric IDs)
    }))
    return [...extraOptions, ...remoteOptions]
  }, [data, extraOptions, labelKey, valueKey])

  // Find the selected option to display its label
  const selectedOption = React.useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : selectedOption ? (
            selectedOption.label
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
        <Command>
          <CommandInput placeholder="Search options..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={String(opt.value)}
                  value={opt.label}
                  onSelect={() => {
                    // Note: Unselect resets to null/undefined or toggles it off
                    onValueChange(String(opt.value) === String(value) ? null : opt.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      String(value) === String(opt.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
