'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return // Aún cargando

    if (status === 'authenticated' && session) {
      console.log('✅ Ya hay sesión, redirigiendo al dashboard')
      router.push('/')
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Credenciales incorrectas')
        console.log('❌ Error de login:', result.error)
      } else if (result?.ok) {
        console.log('✅ Login exitoso, redirigiendo...')

        // Guardar datos del usuario temporalmente
        const userData = {
          username: username,
          name: username === 'ricardo' ? 'Ricardo Marquez' :
                username === 'contadora' ? 'Ana Rodríguez' :
                username === 'dueno1' ? 'Dueño Principal' :
                username === 'dueno2' ? 'Dueño Secundario' : username,
          rol: username === 'ricardo' ? 'administrador' :
               username === 'contadora' ? 'contadora' : 'dueno',
          loginTime: new Date().toISOString()
        }
        localStorage.setItem('tempUser', JSON.stringify(userData))

        // Usar window.location para forzar la redirección
        window.location.href = '/'
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar cargando si NextAuth aún está inicializando
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sistema Financiero</CardTitle>
          <CardDescription>
            Carnicería Principal, Express y Asadero
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
          <div className="mt-6 text-sm text-gray-600 text-center">
            <p>Usa tu usuario y contraseña asignados</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}