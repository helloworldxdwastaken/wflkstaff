import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }: { auth: any, request: { nextUrl: any } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            const isOnAdmin = nextUrl.pathname.startsWith("/admin")

            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            } else if (isOnAdmin) {
                if (isLoggedIn && auth.user.role === "ADMIN") return true
                return false // Redirect non-admins or unauthenticated
            } else if (isLoggedIn && nextUrl.pathname === "/login") {
                return Response.redirect(new URL("/dashboard", nextUrl))
            }

            return true
        },
        jwt({ token, user, account }: { token: any, user: any, account?: any }) {
            if (user) {
                token.id = user.id!
                token.role = user.role!
                token.timezone = user.timezone!
            }
            return token
        },
        session({ session, token }: { session: any, token: any }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as "ADMIN" | "STAFF"
                session.user.timezone = token.timezone as string
            }
            return session
        }
    },
    providers: [],
} satisfies NextAuthConfig
