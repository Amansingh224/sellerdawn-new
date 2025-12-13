"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { useCallback, useState } from "react"

interface Designer {
  id: string
  name: string
}

interface OrderFiltersProps {
  designers: Designer[]
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "DRAFT_PENDING", label: "Draft Pending" },
  { value: "DRAFT_SENT", label: "Draft Sent" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "IN_PRINT_QUEUE", label: "In Print Queue" },
  { value: "PRINTING", label: "Printing" },
  { value: "PRINTED", label: "Printed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "FULFILLED", label: "Fulfilled" },
]

export function OrderFilters({ designers }: OrderFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") || "")

  const currentStatus = searchParams.get("status") || "all"
  const currentDesigner = searchParams.get("designer") || "all"

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "all") {
          newSearchParams.delete(key)
        } else {
          newSearchParams.set(key, value)
        }
      })

      // Reset page when filters change
      newSearchParams.delete("page")

      return newSearchParams.toString()
    },
    [searchParams]
  )

  const handleStatusChange = (value: string) => {
    const query = createQueryString({ status: value })
    router.push(`${pathname}${query ? `?${query}` : ""}`)
  }

  const handleDesignerChange = (value: string) => {
    const query = createQueryString({ designer: value })
    router.push(`${pathname}${query ? `?${query}` : ""}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = createQueryString({ search: search || null })
    router.push(`${pathname}${query ? `?${query}` : ""}`)
  }

  const clearFilters = () => {
    setSearch("")
    router.push(pathname)
  }

  const hasActiveFilters = currentStatus !== "all" || currentDesigner !== "all" || searchParams.get("search")

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <form onSubmit={handleSearch} className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="flex gap-2">
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentDesigner} onValueChange={handleDesignerChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Designer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Designers</SelectItem>
            {designers.map((designer) => (
              <SelectItem key={designer.id} value={designer.id}>
                {designer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
