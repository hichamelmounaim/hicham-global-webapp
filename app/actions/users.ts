'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function updateProfile(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    const name = formData.get('name') as string
    const bio = formData.get('bio') as string
    const avatar = formData.get('avatar') as string

    await prisma.user.update({
        where: { id: session.user.id },
        data: { name: name?.trim() || null, bio: bio?.trim() || null, avatar: avatar?.trim() || null },
    })

    revalidatePath('/profile')
    revalidatePath('/admin/users')
    return { success: true }
}

export async function changePassword(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    const current = formData.get('currentPassword') as string
    const next = formData.get('newPassword') as string
    const confirm = formData.get('confirmPassword') as string

    if (!current || !next) throw new Error('All fields are required')
    if (next !== confirm) throw new Error('New passwords do not match')
    if (next.length < 6) throw new Error('Password must be at least 6 characters')

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) throw new Error('User not found')

    const valid = await bcrypt.compare(current, user.password)
    if (!valid) throw new Error('Current password is incorrect')

    const hash = await bcrypt.hash(next, 12)
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hash } })
    return { success: true }
}

// ADMIN ONLY
export async function getAllUsers() {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') throw new Error('Unauthorized')
    return prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
    })
}

export async function createUser(formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') throw new Error('Unauthorized')

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = (formData.get('role') as string) || 'USER'

    if (!email || !password) throw new Error('Email and password are required')
    if (password.length < 6) throw new Error('Password must be at least 6 characters')

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new Error('Email already in use')

    const hash = await bcrypt.hash(password, 12)
    await prisma.user.create({ data: { name: name?.trim() || null, email, password: hash, role } })
    revalidatePath('/admin/users')
    return { success: true }
}

export async function deleteUser(id: string) {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') throw new Error('Unauthorized')
    if (session.user.id === id) throw new Error('Cannot delete your own account')
    await prisma.user.delete({ where: { id } })
    revalidatePath('/admin/users')
    return { success: true }
}

export async function updateUserRole(id: string, role: 'ADMIN' | 'USER') {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') throw new Error('Unauthorized')
    if (session.user.id === id) throw new Error('Cannot change your own role')
    await prisma.user.update({ where: { id }, data: { role } })
    revalidatePath('/admin/users')
    return { success: true }
}
