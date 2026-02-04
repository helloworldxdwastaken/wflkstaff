'use client'

import { useState } from 'react'
import { authenticate } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormStatus } from 'react-dom'
import { Radio, Lock, Mail, KeyRound, Loader2 } from 'lucide-react'

function LoginButton() {
    const { pending } = useFormStatus()
    return (
        <Button 
            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-base transition-all duration-200 shadow-lg shadow-indigo-500/25" 
            type="submit" 
            disabled={pending}
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                </>
            ) : (
                'Sign In'
            )}
        </Button>
    )
}

export default function LoginPage() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleSubmit = async (formData: FormData) => {
        setErrorMessage(null)
        const result = await authenticate(undefined, formData)
        if (result) {
            setErrorMessage(result)
        }
    }

    return (
        <div className="min-h-screen w-full bg-slate-950 flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 items-center justify-center p-12 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
                </div>
                
                <div className="relative z-10 text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                            <Radio className="h-10 w-10 text-indigo-400" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 mb-4">
                        WFLK
                    </h1>
                    <p className="text-xl text-slate-400 font-medium tracking-wide">
                        Staff Portal
                    </p>
                    <div className="mt-12 space-y-4 text-slate-500 text-sm">
                        <p>Internal Knowledge Base</p>
                        <p>Team Resource Manager</p>
                        <p>Live Analytics</p>
                    </div>
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Radio className="h-8 w-8 text-indigo-400" />
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                                WFLK
                            </h1>
                        </div>
                        <p className="text-slate-500 text-sm">Staff Portal</p>
                    </div>

                    {/* Form header */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                            Welcome back
                        </h2>
                        <p className="text-slate-400">
                            Enter your credentials to access the portal
                        </p>
                    </div>

                    {/* Login form */}
                    <form action={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@wflk.com"
                                    required
                                    className="h-12 pl-11 bg-slate-900/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 focus:ring-2 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                                Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    required
                                    className="h-12 pl-11 bg-slate-900/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 focus:ring-2 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="secureWord" className="text-amber-400 text-sm font-medium flex items-center gap-2">
                                <KeyRound className="h-4 w-4" />
                                Secure Word
                            </Label>
                            <div className="relative">
                                <Input
                                    id="secureWord"
                                    name="secureWord"
                                    type="password"
                                    placeholder="Your secret phrase"
                                    required
                                    className="h-12 bg-amber-950/20 border-amber-900/30 text-amber-100 placeholder:text-amber-800/50 focus:border-amber-500 focus:ring-amber-500/20 focus:ring-2 transition-all"
                                />
                            </div>
                            <p className="text-xs text-slate-600">
                                Additional security verification
                            </p>
                        </div>

                        {errorMessage && (
                            <div className="flex items-center gap-2 p-4 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 text-sm">
                                <div className="shrink-0 w-2 h-2 rounded-full bg-red-500" />
                                {errorMessage}
                            </div>
                        )}

                        <div className="pt-2">
                            <LoginButton />
                        </div>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-slate-600 text-xs">
                        Authorized personnel only. All access is logged.
                    </p>
                </div>
            </div>
        </div>
    )
}
