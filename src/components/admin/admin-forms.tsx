'use client'

import { useState } from 'react'
import { createStaffUser, deleteUser, updateUser } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useFormStatus } from 'react-dom'
import { Trash2, UserPlus, Pencil, Loader2, Shield, ShieldOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { TIMEZONES } from '@/lib/timezones'

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="timezone" className="text-slate-200">Timezone</Label>
                            <select
                                id="timezone"
                                name="timezone"
                                defaultValue="America/New_York"
                                className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {TIMEZONES.map((tz) => (
                                    <option key={tz.value} value={tz.value}>
                                        (UTC{tz.offset}) {tz.label}
                                    </option>
                                ))}
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

export function DeleteUserButton({ userId, userName }: { userId: string; userName?: string }) {
    const router = useRouter()
    const [deleting, setDeleting] = useState(false)

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-950/30"
            disabled={deleting}
            onClick={async () => {
                if (confirm(`Delete user${userName ? ` "${userName}"` : ''}? This will remove all their data.`)) {
                    setDeleting(true)
                    const res = await deleteUser(userId)
                    if (res?.message && !res.success) {
                        alert(res.message)
                    }
                    setDeleting(false)
                    router.refresh()
                }
            }}
        >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
    )
}

interface UserData {
    id: string
    name: string | null
    email: string
    role: string
    jobTitle: string | null
    timezone: string
}

export function EditUserButton({ user, currentUserId }: { user: UserData; currentUserId: string }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [form, setForm] = useState({
        name: user.name || '',
        role: user.role,
        jobTitle: user.jobTitle || '',
        timezone: user.timezone,
    })

    const isSelf = user.id === currentUserId

    const handleSave = async () => {
        setSaving(true)
        setMessage('')
        const res = await updateUser(user.id, {
            name: form.name || undefined,
            role: form.role,
            jobTitle: form.jobTitle,
            timezone: form.timezone,
        })
        setSaving(false)
        if (res.success) {
            setOpen(false)
            router.refresh()
        } else {
            setMessage(res.message)
        }
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500 hover:text-white hover:bg-slate-800"
                onClick={() => {
                    setForm({ name: user.name || '', role: user.role, jobTitle: user.jobTitle || '', timezone: user.timezone })
                    setMessage('')
                    setOpen(true)
                }}
            >
                <Pencil className="h-3.5 w-3.5" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Edit User: {user.name || user.email}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300 text-xs">Name</Label>
                            <Input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="bg-slate-800/50 border-slate-700 text-slate-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300 text-xs">Role</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={isSelf}
                                    className={`flex-1 ${
                                        form.role === 'STAFF'
                                            ? 'bg-slate-700 text-white border border-slate-600'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                                    }`}
                                    onClick={() => setForm(f => ({ ...f, role: 'STAFF' }))}
                                >
                                    <ShieldOff className="h-3.5 w-3.5 mr-1.5" />
                                    Staff
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={isSelf}
                                    className={`flex-1 ${
                                        form.role === 'ADMIN'
                                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/40'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                                    }`}
                                    onClick={() => setForm(f => ({ ...f, role: 'ADMIN' }))}
                                >
                                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                                    Admin
                                </Button>
                            </div>
                            {isSelf && <p className="text-[11px] text-slate-600">You can&apos;t change your own role</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300 text-xs">Job Title</Label>
                            <Input
                                value={form.jobTitle}
                                onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                                placeholder="e.g. DJ, Producer, Manager"
                                className="bg-slate-800/50 border-slate-700 text-slate-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300 text-xs">Timezone</Label>
                            <select
                                value={form.timezone}
                                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                                className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {TIMEZONES.map((tz) => (
                                    <option key={tz.value} value={tz.value}>
                                        (UTC{tz.offset}) {tz.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {message && <p className="text-sm text-red-400 mt-2">{message}</p>}

                    <DialogFooter className="mt-6 gap-2">
                        <Button variant="ghost" onClick={() => setOpen(false)}
                            className="text-slate-400 hover:text-white hover:bg-slate-800">
                            Cancel
                        </Button>
                        <Button variant="ghost" onClick={handleSave} disabled={saving}
                            className="bg-indigo-600/20 text-indigo-300 border border-indigo-600/40 hover:bg-indigo-600/30">
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export function RoleToggle({ userId, currentRole, currentUserId }: { userId: string; currentRole: string; currentUserId: string }) {
    const router = useRouter()
    const [toggling, setToggling] = useState(false)
    const isSelf = userId === currentUserId
    const isAdmin = currentRole === 'ADMIN'

    return (
        <Button
            variant="ghost"
            size="sm"
            disabled={toggling || isSelf}
            title={isSelf ? "Can't change your own role" : `Switch to ${isAdmin ? 'Staff' : 'Admin'}`}
            className={`h-6 px-2 text-[10px] font-bold ${
                isAdmin
                    ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
            onClick={async () => {
                const newRole = isAdmin ? 'STAFF' : 'ADMIN'
                if (!confirm(`Change role to ${newRole}?`)) return
                setToggling(true)
                const res = await updateUser(userId, { role: newRole })
                if (!res.success) alert(res.message)
                setToggling(false)
                router.refresh()
            }}
        >
            {toggling ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                <>
                    {isAdmin ? <Shield className="h-3 w-3 mr-1" /> : <ShieldOff className="h-3 w-3 mr-1" />}
                    {currentRole}
                </>
            )}
        </Button>
    )
}
