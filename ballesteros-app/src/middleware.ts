import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir archivos estáticos y API de auth
  if (pathname.startsWith('/_next') ||
      pathname.startsWith('/api/') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }

  // Obtener sesión
  const session = await auth()

  // Rutas públicas (no requieren autenticación)
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Si está en login y ya tiene sesión, redirigir al dashboard
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Si está en una ruta protegida y NO tiene sesión, redirigir a login
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}