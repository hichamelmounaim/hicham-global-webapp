import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/sign-in']
const ADMIN_ROUTES = ['/admin']

export default auth(function middleware(req: any) {
    const { nextUrl, auth: session } = req
    const isLoggedIn = !!session?.user
    const isPublic = PUBLIC_ROUTES.some(r => nextUrl.pathname.startsWith(r))
    const isApiAuth = nextUrl.pathname.startsWith('/api/auth')
    const isApiCron = nextUrl.pathname.startsWith('/api/cron') // protected by CRON_SECRET in the route handler
    const isNextInternal = nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.startsWith('/favicon')

    // Allow public/api/internal routes
    if (isPublic || isApiAuth || isApiCron || isNextInternal) return NextResponse.next()

    // Not logged in → redirect to sign-in
    if (!isLoggedIn) {
        const signInUrl = new URL('/sign-in', nextUrl.origin)
        signInUrl.searchParams.set('callbackUrl', nextUrl.pathname)
        return NextResponse.redirect(signInUrl)
    }

    // Admin routes: require ADMIN role
    const isAdminRoute = ADMIN_ROUTES.some(r => nextUrl.pathname.startsWith(r))
    if (isAdminRoute && session?.user?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', nextUrl.origin))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
