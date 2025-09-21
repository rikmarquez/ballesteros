import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  console.log('🔥 MIDDLEWARE EXECUTING:', request.nextUrl.pathname)

  const { pathname } = request.nextUrl

  // Permitir archivos estáticos y API de auth
  if (pathname.startsWith('/_next') ||
      pathname.startsWith('/api/') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }

  // Obtener sesión
  const session = await auth()
  console.log('🔍 Session in middleware:', session ? 'EXISTS' : 'NO SESSION')

  // Si está en login y ya tiene sesión, redirigir al dashboard
  if (pathname === '/login' && session) {
    console.log('🔀 Has session, redirecting to dashboard')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Si está en homepage y NO tiene sesión, redirigir a login
  if (pathname === '/' && !session) {
    console.log('🔀 No session, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}