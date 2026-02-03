'use client'

import { useState } from 'react'
import { authenticate } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useFormStatus } from 'react-dom'

function LoginButton() {
    const { pending } = useFormStatus()
    return (
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700" type="submit" disabled={pending}>
            {pending ? 'Accessing Secure Channel...' : 'Authenticate'}
        </Button>
    )
}

export default function LoginPage() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleSubmit = async (formData: FormData) => {
        const result = await authenticate(undefined, formData)
        if (result) {
            setErrorMessage(result)
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950 font-sans text-slate-100">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">WFLK Staff Access</CardTitle>
                    <CardDescription className="text-slate-400">
                        Enter your credentials and secure word to proceed.
                    </CardDescription>
                </CardHeader>
                <form action={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-200">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="staff@wflk.com"
                                required
                                className="border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-200">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="secureWord" className="text-amber-400">Secure Word</Label>
                            <Input
                                id="secureWord"
                                name="secureWord"
                                type="password"
                                placeholder="Your secret phrase"
                                required
                                className="border-amber-900/50 bg-amber-950/10 text-amber-100 placeholder:text-amber-700/50 focus:border-amber-500 focus:ring-amber-500"
                            />
                        </div>
                        {errorMessage && (
                            <div className="rounded-md bg-red-900/20 p-3 text-sm text-red-400 border border-red-900/50">
                                {errorMessage}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <LoginButton />
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
