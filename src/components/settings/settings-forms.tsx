'use client'

import { useState } from 'react'
import { updateProfile } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useFormStatus } from 'react-dom'
import { Settings, Lock, Globe } from 'lucide-react'

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus()
    return (
        <Button disabled={pending} type="submit" className="bg-indigo-600 hover:bg-indigo-700">
            {pending ? 'Saving...' : label}
        </Button>
    )
}

export function SettingsForm({ user }: { user: any }) {
    const [message, setMessage] = useState('')
    const [success, setSuccess] = useState(false)

    async function handleSubmit(formData: FormData) {
        const res = await updateProfile(null, formData)
        setMessage(res.message)
        if (res.success) {
            setSuccess(true)
            // Optional: reset sensitive fields
        }
    }

    return (
        <div className="space-y-6">
            <form action={handleSubmit}>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-100 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-cyan-400" /> Profile Settings
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Update your public profile details and local timezone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-200">Display Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Your Name"
                                defaultValue={user.name || ''}
                                className="bg-slate-800/50 border-slate-700 text-slate-100 max-w-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jobTitle" className="text-slate-200">Job Title</Label>
                            <Input
                                id="jobTitle"
                                name="jobTitle"
                                placeholder="e.g. Morning Host"
                                defaultValue={user.jobTitle || ''}
                                className="bg-slate-800/50 border-slate-700 text-slate-100 max-w-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="timezone" className="text-slate-200">Timezone</Label>
                            <select
                                id="timezone"
                                name="timezone"
                                defaultValue={user.timezone}
                                className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="UTC">Universal Time, UTC</option>
                                <option value="America/New_York">USA, New York</option>
                                <option value="America/Chicago">USA, Chicago</option>
                                <option value="America/Denver">USA, Denver</option>
                                <option value="America/Los_Angeles">USA, Los Angeles</option>
                                <option value="America/Anchorage">USA, Anchorage</option>
                                <option value="Pacific/Honolulu">USA, Honolulu</option>
                                <option value="Europe/London">UK, London</option>
                                <option value="Europe/Paris">France, Paris</option>
                                <option value="Europe/Berlin">Germany, Berlin</option>
                                <option value="Europe/Kiev">Ukraine, Kyiv</option>
                                <option value="Asia/Dubai">UAE, Dubai</option>
                                <option value="Asia/Tokyo">Japan, Tokyo</option>
                                <option value="Asia/Seoul">South Korea, Seoul</option>
                                <option value="Asia/Shanghai">China, Shanghai</option>
                                <option value="Asia/Singapore">Singapore, Singapore</option>
                                <option value="Asia/Jerusalem">Israel, Tel Aviv</option>
                                <option value="Australia/Sydney">Australia, Sydney</option>
                                <option value="Pacific/Auckland">New Zealand, Auckland</option>
                            </select>
                            <p className="text-xs text-slate-500">Select your local timezone.</p>
                        </div>
                        <SubmitButton label="Update Profile" />
                        {message && !message.includes("Secure") && <p className={`mt-2 text-sm ${success ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
                    </CardContent>
                </Card>
            </form>

            <form action={handleSubmit}>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-100 flex items-center gap-2">
                            <Lock className="h-5 w-5 text-amber-400" /> Security Settings
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Update your Secure Word. You must provide your current password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-slate-200">Current Password</Label>
                            <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                className="bg-slate-800/50 border-slate-700 text-slate-100 max-w-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newSecureWord" className="text-amber-400">New Secure Word</Label>
                            <Input
                                id="newSecureWord"
                                name="newSecureWord"
                                type="password"
                                className="bg-slate-800/50 border-amber-900/40 text-slate-100 max-w-md"
                            />
                        </div>
                        <SubmitButton label="Change Secure Word" />
                        {message && message.includes("Secure") && <p className={`mt-2 text-sm ${success ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
                        {message && (message === "User not found" || message === "Incorrect password") && <p className="mt-2 text-sm text-red-400">{message}</p>}
                    </CardContent>
                </Card>
            </form>

            <form action={handleSubmit}>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-100 flex items-center gap-2">
                            <span className="h-5 w-5 bg-[#5865F2] rounded-full flex items-center justify-center text-xs text-white font-bold">D</span>
                            Discord Integration
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Enter your Discord User ID to sync your profile picture.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="discordId" className="text-[#5865F2]">Discord User ID</Label>
                            <Input
                                id="discordId"
                                name="discordId"
                                placeholder="e.g. 198273645091827364"
                                defaultValue={user.discordId || ''}
                                className="bg-slate-800/50 border-[#5865F2]/30 text-slate-100 max-w-md focus:border-[#5865F2]"
                            />
                            <p className="text-xs text-slate-500">
                                Developer Mode must be enabled on Discord to copy your ID. (Right click user &gt; Copy User ID)
                            </p>
                        </div>
                        <SubmitButton label="Sync Discord Profile" />
                        {message && !message.includes("Secure") && !message.includes("Timezone") && <p className={`mt-2 text-sm ${success ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
