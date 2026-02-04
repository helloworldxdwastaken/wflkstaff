'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { createPoll } from '@/actions/poll-actions'
import { useRouter } from 'next/navigation'

export function CreatePollDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = await createPoll(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setOpen(false)
            setLoading(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    New Poll
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl">Create a Poll</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="question" className="text-slate-200">Question</Label>
                        <Input
                            id="question"
                            name="question"
                            placeholder="What should we decide?"
                            required
                            className="bg-slate-800/50 border-slate-700 text-slate-100"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-slate-200">Description (optional)</Label>
                        <Input
                            id="description"
                            name="description"
                            placeholder="Add more context..."
                            className="bg-slate-800/50 border-slate-700 text-slate-100"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="options" className="text-slate-200">Options</Label>
                        <Textarea
                            id="options"
                            name="options"
                            placeholder="Enter each option on a new line:&#10;Option 1&#10;Option 2&#10;Option 3"
                            required
                            rows={4}
                            className="bg-slate-800/50 border-slate-700 text-slate-100 resize-none"
                        />
                        <p className="text-xs text-slate-500">One option per line, minimum 2 options</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="expiresIn" className="text-slate-200">Expires in (optional)</Label>
                        <select
                            id="expiresIn"
                            name="expiresIn"
                            className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Never expires</option>
                            <option value="1">1 hour</option>
                            <option value="6">6 hours</option>
                            <option value="24">24 hours</option>
                            <option value="48">2 days</option>
                            <option value="168">1 week</option>
                        </select>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Poll'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
