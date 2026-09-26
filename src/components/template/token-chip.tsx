'use client'

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function TokenChip({
    tokenName,
    bindings,
    onSave
}: {
    tokenName: string,
    bindings: Record<string, string[]>,
    onSave: (name: string, val: string[]) => void
}) {
    const [open, setOpen] = React.useState(false)
    const [inputVal, setInputVal] = React.useState((bindings[tokenName] || []).join(","))

    // Update input when token opens if bindings changed externally
    React.useEffect(() => {
        if (open) setInputVal((bindings[tokenName] || []).join(","))
    }, [open, bindings, tokenName])

    const valArr = bindings[tokenName] || []
    const hasValue = valArr.length > 0 && valArr[0] !== ""

    let label = `<${tokenName}/>`
    if (hasValue) {
        label = valArr.length > 1 ? `${valArr[0]}等${valArr.length}个` : valArr[0]
    }

    const handleSaveToken = () => {
        onSave(tokenName, inputVal.split(",").map(s => s.trim()).filter(Boolean))
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Badge
                    variant={hasValue ? "default" : "outline"}
                    className="mx-1 cursor-pointer font-mono text-sm inline-block"
                >
                    {label}
                </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
                <div className="space-y-4">
                    <h4 className="font-medium text-sm leading-none">{tokenName} Binding</h4>
                    <Input
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder="Enter comma separated values..."
                    />
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveToken}>Save</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
