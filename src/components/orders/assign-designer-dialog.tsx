"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface Designer {
  id: string
  name: string
  email: string
}

interface AssignDesignerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderIds: string[]
  onSuccess: () => void
}

export function AssignDesignerDialog({
  open,
  onOpenChange,
  orderIds,
  onSuccess,
}: AssignDesignerDialogProps) {
  const [designers, setDesigners] = useState<Designer[]>([])
  const [selectedDesigner, setSelectedDesigner] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchDesigners()
    }
  }, [open])

  const fetchDesigners = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/users?role=DESIGNER")
      const data = await response.json()
      setDesigners(data.users || [])
    } catch (error) {
      console.error("Failed to fetch designers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedDesigner) {
      toast({
        title: "Error",
        description: "Please select a designer",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      if (orderIds.length === 1) {
        // Single assignment
        const response = await fetch(`/api/orders/${orderIds[0]}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ designerId: selectedDesigner }),
        })

        if (!response.ok) {
          throw new Error("Failed to assign designer")
        }

        toast({
          title: "Success",
          description: "Designer assigned successfully",
        })
      } else {
        // Bulk assignment
        const response = await fetch("/api/orders/bulk-assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderIds,
            designerId: selectedDesigner,
          }),
        })

        const result = await response.json()

        if (result.success > 0) {
          toast({
            title: "Success",
            description: `Assigned ${result.success} orders to designer`,
          })
        }

        if (result.failed > 0) {
          toast({
            title: "Warning",
            description: `Failed to assign ${result.failed} orders`,
            variant: "destructive",
          })
        }
      }

      onSuccess()
      onOpenChange(false)
      setSelectedDesigner("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign designer",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Designer</DialogTitle>
          <DialogDescription>
            {orderIds.length === 1
              ? "Select a designer to assign to this order"
              : `Select a designer to assign to ${orderIds.length} orders`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
              <SelectTrigger>
                <SelectValue placeholder="Select a designer" />
              </SelectTrigger>
              <SelectContent>
                {designers.map((designer) => (
                  <SelectItem key={designer.id} value={designer.id}>
                    {designer.name} ({designer.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={submitting || !selectedDesigner}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
