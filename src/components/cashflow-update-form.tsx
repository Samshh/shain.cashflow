import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { type Cashflow, useCashflowStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface CashflowUpdateFormProps {
  cashflow: Cashflow
}

type CashflowFormState = {
  name: string
  category: 'income' | 'expense'
  amount: string
  date: string
  description: string
}

const formatDateForInput = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toISOString().split('T')[0]
}

const buildFormState = (cashflow: Cashflow): CashflowFormState => ({
  name: cashflow.name,
  category: cashflow.category as 'income' | 'expense',
  amount: cashflow.amount.toString(),
  date: formatDateForInput(cashflow.date),
  description: cashflow.description ?? '',
})

export function CashflowUpdateForm({ cashflow }: CashflowUpdateFormProps) {
  const { updateCashflow } = useCashflowStore()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<CashflowFormState>(() =>
    buildFormState(cashflow),
  )

  useEffect(() => {
    setFormData(buildFormState(cashflow))
  }, [cashflow])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCategoryChange = (value: 'income' | 'expense') => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }))
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.amount) {
      toast.error('Error', {
        description: 'Please fill in all required fields.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await updateCashflow(cashflow.id, {
        name: formData.name,
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description,
      })

      setOpen(false)
      toast.success('Success', {
        description: 'Cashflow entry has been updated successfully.',
      })
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message
          : 'Unable to update the cashflow entry.'
      toast.error('Error', { description })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Cashflow Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Name *
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Monthly Salary"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-foreground">
                Category *
              </Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground">
                Amount *
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-foreground">
                Date *
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Add notes about this cashflow entry..."
              value={formData.description}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-6">
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <Button className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Entry'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Confirm Update</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to update this cashflow entry?
                </AlertDialogDescription>
                <div className="flex justify-end gap-2">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update'}
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
