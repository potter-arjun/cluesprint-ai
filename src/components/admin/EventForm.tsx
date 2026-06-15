'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  theme: z.string().min(2, 'Theme required'),
  venue: z.string().optional(),
  max_teams: z.number().int().min(2).max(100),
  max_players_per_team: z.number().int().min(1).max(20),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface EventFormProps {
  defaultValues?: Partial<FormData>
  onSubmit: (data: FormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

const THEMES = [
  'Corporate Heist',
  'Space Odyssey',
  'Ancient Mystery',
  'Cyber Thriller',
  'Time Travel',
  'Ocean Depths',
  'Desert Survival',
  'Jungle Expedition',
]

export function EventForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Save Event' }: EventFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      max_teams: 10,
      max_players_per_team: 5,
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Label htmlFor="name">Event Title *</Label>
          <Input
            id="name"
            placeholder="e.g. Innovation Sprint 2025"
            className="mt-1"
            {...register('name')}
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief overview of the event..."
            className="mt-1 resize-none"
            rows={3}
            {...register('description')}
          />
        </div>

        <div>
          <Label>Story Theme *</Label>
          <Select onValueChange={v => setValue('theme', v)} defaultValue={defaultValues?.theme}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Choose a theme" />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.theme && <p className="text-red-400 text-xs mt-1">{errors.theme.message}</p>}
        </div>

        <div>
          <Label htmlFor="venue">Venue</Label>
          <Input id="venue" placeholder="Office floor, conference hall..." className="mt-1" {...register('venue')} />
        </div>

        <div>
          <Label htmlFor="max_teams">Max Teams</Label>
          <Input
            id="max_teams"
            type="number"
            min={2}
            max={100}
            className="mt-1"
            {...register('max_teams', { valueAsNumber: true })}
          />
          {errors.max_teams && <p className="text-red-400 text-xs mt-1">{errors.max_teams.message}</p>}
        </div>

        <div>
          <Label htmlFor="max_players_per_team">Max Team Size</Label>
          <Input
            id="max_players_per_team"
            type="number"
            min={1}
            max={20}
            className="mt-1"
            {...register('max_players_per_team', { valueAsNumber: true })}
          />
          {errors.max_players_per_team && <p className="text-red-400 text-xs mt-1">{errors.max_players_per_team.message}</p>}
        </div>

        <div>
          <Label htmlFor="starts_at">Start Date & Time</Label>
          <Input id="starts_at" type="datetime-local" className="mt-1" {...register('starts_at')} />
        </div>

        <div>
          <Label htmlFor="ends_at">End Date & Time</Label>
          <Input id="ends_at" type="datetime-local" className="mt-1" {...register('ends_at')} />
        </div>
      </div>

      <Button type="submit" variant="cyber" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : submitLabel}
      </Button>
    </form>
  )
}
