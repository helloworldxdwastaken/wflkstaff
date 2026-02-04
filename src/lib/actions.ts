'use server'

import { signIn } from '@/auth'
// import { AuthError } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

// --- Auth Action ---
export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData)
    } catch (error: any) {
        // NextAuth throws a NEXT_REDIRECT on successful login - let it through
        if (error?.digest?.includes('NEXT_REDIRECT')) {
            throw error
        }
        if (error?.type === 'CredentialsSignin') {
            return 'Invalid credentials or secure word.'
        }
        return 'Something went wrong.'
    }
}

// --- Admin Actions ---

const CreateUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    secureWord: z.string().min(4),
    role: z.enum(["ADMIN", "STAFF"]),
    timezone: z.string().min(1),
    jobTitle: z.string().optional(),
})

export async function createStaffUser(prevState: any, formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
        return { message: "Unauthorized" }
    }

    const rawData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        secureWord: formData.get('secureWord'),
        role: formData.get('role'),
        timezone: formData.get('timezone') || "America/New_York",
        jobTitle: formData.get('jobTitle') || "Staff",
    }

    const validatedData = CreateUserSchema.safeParse(rawData)

    if (!validatedData.success) {
        return { message: "Invalid data. Please check inputs." }
    }

    const { name, email, password, secureWord, role, timezone, jobTitle } = validatedData.data

    try {
        const passwordHash = await bcrypt.hash(password, 10)
        const secureWordHash = await bcrypt.hash(secureWord, 10)

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                secureWordHash,
                role, // In SQLite version this is storing the string, but validated by Zod
                timezone,
                jobTitle,
            }
        })

        revalidatePath('/admin')
        return { message: "User created successfully!", success: true }
    } catch (e) {
        console.error(e)
        return { message: "Failed to create user. Email might be in use." }
    }
}

export async function deleteUser(userId: string) {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
        return { message: "Unauthorized" }
    }

    // Prevent self-deletion
    if (session.user.id === userId) {
        return { message: "Cannot delete yourself." }
    }

    try {
        await prisma.user.delete({ where: { id: userId } })
        revalidatePath('/admin')
        return { message: "User deleted." }
    } catch (e) {
        console.error("Delete user error:", e)
        return { message: "Failed to delete user." }
    }
}

const InfoItemSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    content: z.string().min(1),
    type: z.enum(["LINK", "SECRET", "FILE"]),
    visibleTo: z.string().optional() // Default to ALL
})

export async function createInfoItem(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user) {
        return { message: "Unauthorized" }
    }

    const rawData = {
        title: formData.get('title'),
        description: formData.get('description'),
        content: formData.get('content'),
        type: formData.get('type'),
        visibleTo: "ALL",
    }

    const validatedData = InfoItemSchema.safeParse(rawData)
    if (!validatedData.success) {
        return { message: "Invalid data." }
    }

    try {
        await prisma.infoItem.create({
            data: {
                title: validatedData.data.title,
                description: validatedData.data.description || "",
                content: validatedData.data.content,
                type: validatedData.data.type,
                visibleTo: (validatedData.data.visibleTo || "ALL") as string
            }
        })
        revalidatePath('/dashboard')
        revalidatePath('/admin')
        return { message: "Info item added!", success: true }
    } catch (e) {
        console.error(e)
        return { message: "Failed to add info item." }
    }
}

export async function deleteInfoItem(itemId: string) {
    const session = await auth()
    if (!session?.user) return { message: "Unauthorized" }

    try {
        await prisma.infoItem.delete({ where: { id: itemId } })
        revalidatePath('/dashboard')
        return { message: "Item deleted." }
    } catch (e) {
        return { message: "Failed to delete item." }
    }
}

export async function updateInfoItem(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user) return { message: "Unauthorized" }

    const itemId = formData.get('itemId') as string
    if (!itemId) return { message: "Item ID missing." }

    const rawData = {
        title: formData.get('title'),
        description: formData.get('description'),
        content: formData.get('content'),
        type: formData.get('type'),
        visibleTo: "ALL",
    }

    const validatedData = InfoItemSchema.safeParse(rawData)
    if (!validatedData.success) {
        return { message: "Invalid data." }
    }

    try {
        await prisma.infoItem.update({
            where: { id: itemId },
            data: {
                title: validatedData.data.title,
                description: validatedData.data.description || "",
                content: validatedData.data.content,
                type: validatedData.data.type,
                visibleTo: (validatedData.data.visibleTo || "ALL") as string
            }
        })
        revalidatePath('/dashboard')
        return { message: "Item updated!", success: true }
    } catch (e) {
        console.error(e)
        return { message: "Failed to update info item." }
    }
}

const UpdateProfileSchema = z.object({
    name: z.string().min(1).optional(),
    timezone: z.string().optional(),
    currentPassword: z.string().optional(),
    newSecureWord: z.string().optional(),
    discordId: z.string().optional(),
    jobTitle: z.string().optional(),
})

export async function updateProfile(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user) return { message: "Unauthorized" }

    const rawData = {
        name: formData.get('name') || undefined,
        timezone: formData.get('timezone') || undefined,
        currentPassword: formData.get('currentPassword') || undefined,
        newSecureWord: formData.get('newSecureWord') || undefined,
        discordId: formData.get('discordId') || undefined,
        jobTitle: formData.get('jobTitle') || undefined,
    }

    const val = UpdateProfileSchema.safeParse(rawData)
    if (!val.success) return { message: "Invalid input" }

    const { name, timezone, currentPassword, newSecureWord, discordId, jobTitle } = val.data
    const dataToUpdate: any = {}

    if (name) dataToUpdate.name = name
    if (timezone) dataToUpdate.timezone = timezone
    if (jobTitle) dataToUpdate.jobTitle = jobTitle

    if (discordId) {
        // Fetch Discord Avatar using a public lookup service or proxy
        try {
            // Using a reliable public API for Discord lookups that doesn't require auth
            // Note: In a production environment with high volume, you'd want your own bot
            const res = await fetch(`https://discordlookup.mesavirep.xyz/v1/user/${discordId}`)

            if (res.ok) {
                const discordData = await res.json()
                if (discordData.avatar) {
                    dataToUpdate.image = `https://cdn.discordapp.com/avatars/${discordId}/${discordData.avatar}.png`
                    dataToUpdate.discordId = discordId
                } else if (discordData.id) {
                    // User has no avatar, use default
                    const defaultAvatarIndex = (BigInt(discordId) >> BigInt(22)) % BigInt(6)
                    dataToUpdate.image = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex.toString()}.png`
                    dataToUpdate.discordId = discordId
                }
            } else {
                return { message: "Could not find Discord user. Check ID." }
            }
        } catch (error) {
            console.error("Discord fetch error:", error)
            return { message: "Failed to fetch Discord profile." }
        }
    }

    if (newSecureWord) {
        if (!currentPassword) return { message: "Current password required to change Secure Word" }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (!user) return { message: "User not found" }

        const match = await bcrypt.compare(currentPassword, user.passwordHash)
        if (!match) return { message: "Incorrect password" }

        dataToUpdate.secureWordHash = await bcrypt.hash(newSecureWord, 10)
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: dataToUpdate
        })
        revalidatePath('/dashboard')
        revalidatePath('/settings')
        revalidatePath('/admin')
        return { message: "Profile updated!", success: true }
    } catch (e) {
        console.error("Profile update error:", e)
        return { message: "Update failed. Please try again." }
    }
}
