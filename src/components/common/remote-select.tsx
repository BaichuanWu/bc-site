import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import useSWR from "swr"

interface RemoteSelectProps {
  endpoint: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  labelKey?: string;
  valueKey?: string;
  extraOptions?: { label: string; value: string }[];
  className?: string;
  disabled?: boolean;
}

/**
 * A reusable Select component that fetches its options from a remote API endpoint.
 * Optimized with SWR for caching and automatic revalidation.
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
  // Use SWR to fetch and cache the data
  const { data, isLoading } = useSWR(endpoint, (url) => 
    apiClient.get(url).then(res => res.data?.dataSource || res.data?.data || [])
  )

  const options = React.useMemo(() => {
    const remoteOptions = (data || []).map((item: any) => ({
      label: String(item[labelKey]),
      value: String(item[valueKey]),
    }))
    return [...extraOptions, ...remoteOptions]
  }, [data, extraOptions, labelKey, valueKey])

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
        {options.length === 0 && !isLoading && (
          <div className="p-2 text-xs text-muted-foreground text-center">No options found</div>
        )}
      </SelectContent>
    </Select>
  )
}
