'use client'

import { useState } from 'react'
import { createStaffUser, createInfoItem, deleteUser } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFormStatus } from 'react-dom'
import { Trash2, UserPlus, FilePlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus()
    return (
        <Button disabled={pending} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
            {pending ? 'Processing...' : label}
        </Button>
    )
}

export function CreateUserForm() {
    const [message, setMessage] = useState<string>('')
    const [success, setSuccess] = useState(false)

    async function handleSubmit(formData: FormData) {
        const res = await createStaffUser(null, formData)
        setMessage(res.message)
        if (res.success) setSuccess(true)
    }

    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-indigo-400" /> Create New User
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-200">Name</Label>
                            <Input id="name" name="name" placeholder="John Doe" required className="bg-slate-800/50 border-slate-700 text-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-200">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="john@wflk.com" required className="bg-slate-800/50 border-slate-700 text-slate-100" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-200">Initial Password</Label>
                        <Input id="password" name="password" type="password" required className="bg-slate-800/50 border-slate-700 text-slate-100" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="secureWord" className="text-amber-400">Secure Word</Label>
                        <Input id="secureWord" name="secureWord" type="text" required className="bg-slate-800/50 border-amber-900/40 text-slate-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-slate-200">Role</Label>
                            <select id="role" name="role" className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm">
                                <option value="STAFF">Staff</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jobTitle" className="text-slate-200">Job Title</Label>
                            <Input id="jobTitle" name="jobTitle" placeholder="Staff Member" className="bg-slate-800/50 border-slate-700 text-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="timezone" className="text-slate-200">Timezone</Label>
                            <select
                                id="timezone"
                                name="timezone"
                                defaultValue="America/New_York"
                                className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="UTC">Universal Time, UTC</option>
                                <option value="America/New_York">USA, New York</option>
                                <option value="America/Chicago">USA, Chicago</option>
                                <option value="America/Denver">USA, Denver</option>
                                <option value="America/Los_Angeles">USA, Los Angeles</option>
                                <option value="Europe/London">UK, London</option>
                                <option value="Europe/Paris">France, Paris</option>
                                <option value="Asia/Jerusalem">Israel, Tel Aviv</option>
                                <option value="Asia/Tokyo">Japan, Tokyo</option>
                                <option value="Asia/Singapore">Singapore, Singapore</option>
                                <option value="Australia/Sydney">Australia, Sydney</option>
                            </select>
                        </div>
                    </div>
                    <SubmitButton label="Create User" />
                    {message && <p className={`text-sm ${success ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
                </form>
            </CardContent>
        </Card>
    )
}



export function DeleteUserButton({ userId }: { userId: string }) {
    const router = useRouter()
    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
            onClick={async () => {
                if (confirm("Are you sure you want to delete this user?")) {
                    const res = await deleteUser(userId)
                    if (res?.message && res.message !== "User deleted.") {
                        alert(res.message)
                    }
                    router.refresh()
                }
            }}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
