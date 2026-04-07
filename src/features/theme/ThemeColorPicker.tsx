import { useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ThemeColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

export function ThemeColorPicker({ label, color, onChange }: ThemeColorPickerProps) {
  const [hexInput, setHexInput] = useState(color)

  function handleHexChange(value: string) {
    setHexInput(value)
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onChange(value.toUpperCase())
    }
  }

  function handlePickerChange(value: string) {
    const upper = value.toUpperCase()
    setHexInput(upper)
    onChange(upper)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="h-8 w-8 rounded-md border border-gray-300 shadow-sm"
            style={{ backgroundColor: color }}
            title={label}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-2">
            <HexColorPicker color={color} onChange={handlePickerChange} />
            <Input
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              className="font-mono text-xs"
              placeholder="#RRGGBB"
            />
          </div>
        </PopoverContent>
      </Popover>
      <Label className="text-sm">{label}</Label>
    </div>
  )
}
