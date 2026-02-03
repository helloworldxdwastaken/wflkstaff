import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
    secureWord: z.string().min(1, "Secure word is required"),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma) as any,
    session: { strategy: "jwt" },
    ...authConfig,
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                secureWord: { label: "Secure Word", type: "password" }
            },
            async authorize(credentials) {
                const parsedCredentials = LoginSchema.safeParse(credentials)

                if (parsedCredentials.success) {
                    const { email, password, secureWord } = parsedCredentials.data

                    const user = await prisma.user.findUnique({ where: { email } })
                    if (!user) return null

                    // Verify Password
                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
                    if (!passwordsMatch) return null

                    // Verify Secure Word
                    const secureWordsMatch = await bcrypt.compare(secureWord, user.secureWordHash)
                    if (!secureWordsMatch) return null

                    // Log activity (fire and forget)
                    try {
                        await prisma.activityLog.create({
                            data: {
                                userId: user.id,
                                action: "LOGIN",
                            }
                        })
                    } catch (e) {
                        console.error("Failed to log activity", e)
                    }

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role as "ADMIN" | "STAFF",
                        timezone: user.timezone
                    }
                }

                console.log("Invalid credentials")
                return null
            },
        }),
    ],
})
