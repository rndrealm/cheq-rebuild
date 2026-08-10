"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AnyFieldApi } from "@tanstack/react-form"

function formatErrors(errors: unknown[]): string {
  return errors
    .map((e) => {
      if (typeof e === "string") return e
      if (e && typeof e === "object" && "message" in e) return (e as { message: string }).message
      return String(e)
    })
    .join(", ")
}

function FieldError({ field }: { field: AnyFieldApi }) {
  if (!field.state.meta.isTouched || field.state.meta.errors.length === 0) {
    return null
  }
  return (
    <p className="text-xs font-semibold text-destructive">
      {formatErrors(field.state.meta.errors)}
    </p>
  )
}

function FormField({
  field,
  label,
  hint,
  children,
  ...inputProps
}: {
  field: AnyFieldApi
  label: string
  hint?: string
  children?: React.ReactNode
} & Omit<React.ComponentProps<"input">, "children">) {
  const id = inputProps.id ?? field.name

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children ?? (
        <Input
          id={id}
          value={field.state.value}
          onChange={(e) =>
            inputProps.type === "number"
              ? field.handleChange(Number(e.target.value))
              : field.handleChange(e.target.value)
          }
          onBlur={field.handleBlur}
          {...inputProps}
        />
      )}
      {hint && <p className="text-xs font-semibold text-fg-300">{hint}</p>}
      <FieldError field={field} />
    </div>
  )
}

export { FormField, FieldError }
