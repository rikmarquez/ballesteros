'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Calculator,
  Database,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Building2
} from 'lucide-react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const [tempUser, setTempUser] = useState<any>(null)

  // Cargar usuario temporal desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('tempUser')
      if (savedUser) {
        setTempUser(JSON.parse(savedUser))
      }
    }
  }, [])

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

  // Usar sesión de NextAuth o fallback a localStorage
  const currentUser = session?.user || tempUser

  return (
    <div className="container mx-auto p-6">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Principal</h1>
              <p className="text-gray-600">Sistema de Control Financiero - Grupo Ballesteros</p>
            </div>
          </div>

          {/* Información del usuario y botón de cerrar sesión */}
          {currentUser && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Bienvenido</p>
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500">@{currentUser.username}</p>
                {currentUser.rol && (
                  <p className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full inline-block mt-1">
                    {currentUser.rol === 'administrador' ? '👨‍💼 Administrador' :
                     currentUser.rol === 'contadora' ? '💰 Contadora' :
                     currentUser.rol === 'dueno' ? '👑 Dueño' : currentUser.rol}
                  </p>
                )}
              </div>
              <Button variant="outline" onClick={() => {
                // Limpiar usuario temporal y redirigir a login
                localStorage.removeItem('tempUser')
                if (session) {
                  signOut({ callbackUrl: '/login' })
                } else {
                  window.location.href = '/login'
                }
              }}>
                Cerrar Sesión
              </Button>
            </div>
          )}

          {/* Fallback si no hay sesión */}
          {!currentUser && (
            <div className="text-red-600">
              <p>⚠️ No hay sesión detectada</p>
              <Button variant="outline" onClick={() => window.location.href = '/login'}>
                Ir a Login
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Módulos principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

        {/* Cortes de Caja */}
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100">
                <Calculator className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Cortes de Caja</CardTitle>
                <CardDescription>Gestión diaria de efectivo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Control de cortes diarios con cálculos automáticos y validación de diferencias.
            </p>
            <Link href="/dashboard/cortes">
              <Button className="w-full gap-2">
                <Calculator className="h-4 w-4" />
                Gestionar Cortes
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Catálogos */}
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Catálogos</CardTitle>
                <CardDescription>Empleados, clientes y proveedores</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Gestión centralizada de entidades con acceso multi-empresa.
            </p>
            <Link href="/dashboard/catalogos">
              <Button className="w-full gap-2">
                <Database className="h-4 w-4" />
                Gestionar Catálogos
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Reportes (Próximamente) */}
        <Card className="opacity-60 cursor-not-allowed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Reportes
                  <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                    Próximamente
                  </span>
                </CardTitle>
                <CardDescription>Análisis y tendencias</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Dashboard de métricas y reportes consolidados del grupo.
            </p>
            <Button className="w-full gap-2" disabled>
              <TrendingUp className="h-4 w-4" />
              Próximamente
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Información del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Estado del sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Estado del Sistema
            </CardTitle>
            <CardDescription>Información general y estado actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Módulo de Cortes</span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  ✅ Operativo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sistema de Catálogos</span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  ✅ Operativo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base de Datos</span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  ✅ Conectada
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">APIs Unificadas</span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  ✅ Funcionando
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de empresas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Grupo Ballesteros
            </CardTitle>
            <CardDescription>Empresas del grupo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Carnicería Principal</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Carnicería Express</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">Asadero Ballesteros</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600">
                  Sistema unificado con acceso multi-empresa para todas las entidades.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Accesos Rápidos</CardTitle>
          <CardDescription>Enlaces directos a funciones principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/cortes/nuevo">
              <Button variant="outline" className="w-full gap-2">
                <Calculator className="h-4 w-4" />
                Nuevo Corte
              </Button>
            </Link>
            <Link href="/dashboard/empleados/nuevo">
              <Button variant="outline" className="w-full gap-2">
                <Users className="h-4 w-4" />
                Nuevo Empleado
              </Button>
            </Link>
            <Link href="/dashboard/clientes/nuevo">
              <Button variant="outline" className="w-full gap-2">
                <Users className="h-4 w-4" />
                Nuevo Cliente
              </Button>
            </Link>
            <Link href="/dashboard/proveedores/nuevo">
              <Button variant="outline" className="w-full gap-2">
                <Users className="h-4 w-4" />
                Nuevo Proveedor
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Ayuda */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              💡 <strong>Sistema Unificado:</strong> Todos los empleados, clientes y proveedores
              tienen acceso automático a todas las empresas del grupo para máxima flexibilidad operativa.
            </p>
            <p>
              Si necesitas ayuda con algún módulo, revisa la documentación o contacta al administrador del sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
