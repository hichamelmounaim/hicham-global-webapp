import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

declare module 'next-auth' {
    interface User { role: string }
    interface Session { user: { id: string; role: string; name?: string | null; email?: string | null; image?: string | null } }
}

import { JWT } from 'next-auth/jwt'

declare module 'next-auth/jwt' {
    interface JWT { role: string; id: string }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: process.env.AUTH_SECRET,
    session: { strategy: 'jwt' },
    pages: { signIn: '/sign-in' },

    providers: [
        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                })
                if (!user) return null

                const valid = await bcrypt.compare(credentials.password as string, user.password)
                if (!valid) return null

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: user.avatar,
                }
            },
        }),
    ],

    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.id = (user as any).id
            }
            return token
        },
        session({ session, token }) {
            if (session.user) {
                session.user.role = token.role
                session.user.id = token.id
            }
            return session
        },
    },
})
