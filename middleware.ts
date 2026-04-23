import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/u/')) {
    const parts = pathname.split('/')
    const token = parts[2]

    if (!token) return new NextResponse('Not Found', { status: 404 })

    const userAToken = process.env.USER_A_TOKEN
    const userBToken = process.env.USER_B_TOKEN

    let userId: string | null = null
    if (token === userAToken) userId = 'a'
    else if (token === userBToken) userId = 'b'

    if (!userId) return new NextResponse('Not Found', { status: 404 })

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', userId)
    requestHeaders.set('x-user-token', token)

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  if (pathname.startsWith('/admin/')) {
    const parts = pathname.split('/')
    const token = parts[2]

    if (!token) return new NextResponse('Not Found', { status: 404 })

    if (token !== process.env.ADMIN_TOKEN) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-is-admin', 'true')
    requestHeaders.set('x-admin-token', token)

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/u/:path*', '/admin/:path*'],
}
