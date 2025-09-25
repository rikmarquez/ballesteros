'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart3,
  Calculator,
  Database,
  TrendingUp,
  Users,
  DollarSign,
  Building2,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

interface EmpresaData {
  id: number
  nombre: string
  activa: boolean
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const [tempUser, setTempUser] = useState<any>(null)
  const [empresas, setEmpresas] = useState<EmpresaData[]>([])
  const [empresaActiva, setEmpresaActiva] = useState<number>(1) // Por defecto empresa 1
  const [loadingEmpresas, setLoadingEmpresas] = useState(true)

  // Cargar usuario temporal desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('tempUser')
      if (savedUser) {
        setTempUser(JSON.parse(savedUser))
      }

      // Cargar empresa activa guardada
      const savedEmpresa = localStorage.getItem('empresaActiva')
      if (savedEmpresa) {
        setEmpresaActiva(parseInt(savedEmpresa))
      }
    }
  }, [])

  // Cargar empresas
  const cargarEmpresas = async () => {
    try {
      setLoadingEmpresas(true)
      const response = await fetch('/api/empresas?activa=true')
      if (!response.ok) throw new Error('Error al cargar empresas')
      const data = await response.json()
      setEmpresas(data.empresas)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoadingEmpresas(false)
    }
  }

  // Cargar empresas al montar el componente
  useEffect(() => {
    cargarEmpresas()
  }, [])

  // Cambiar empresa activa
  const cambiarEmpresa = (nuevaEmpresaId: string) => {
    const id = parseInt(nuevaEmpresaId)
    setEmpresaActiva(id)
    localStorage.setItem('empresaActiva', id.toString())
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

  // Usar sesión de NextAuth o fallback a localStorage
  const currentUser = session?.user || tempUser

  // Obtener empresa actual
  const empresaActualData = empresas.find(e => e.id === empresaActiva)

  return (
    <div className="container mx-auto p-6">

      {/* Selector de Empresa - Prominente */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-900">
                    {loadingEmpresas ? (
                      <div className="w-48 h-6 bg-blue-200 animate-pulse rounded"></div>
                    ) : (
                      empresaActualData?.nombre || 'Cargar empresa...'
                    )}
                  </h2>
                  <p className="text-sm text-blue-700">Empresa activa actual</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right text-sm text-blue-600">
                <p>Cambiar empresa:</p>
              </div>
              <Select
                value={empresaActiva.toString()}
                onValueChange={cambiarEmpresa}
                disabled={loadingEmpresas}
              >
                <SelectTrigger className="w-64 bg-white border-blue-300 hover:bg-blue-50">
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {empresa.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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

        {/* Movimientos */}
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Movimientos</CardTitle>
                <CardDescription>Registro detallado de transacciones</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Gestión completa de movimientos financieros con trazabilidad y categorización.
            </p>
            <Link href="/dashboard/movimientos">
              <Button className="w-full gap-2">
                <DollarSign className="h-4 w-4" />
                Gestionar Movimientos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Accesos Rápidos</CardTitle>
          <CardDescription>Enlaces directos a funciones principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/dashboard/cortes/nuevo">
              <Button variant="outline" className="w-full gap-2">
                <Calculator className="h-4 w-4" />
                Nuevo Corte
              </Button>
            </Link>
            <Link href="/dashboard/movimientos/nuevo">
              <Button variant="outline" className="w-full gap-2">
                <DollarSign className="h-4 w-4" />
                Nuevo Movimiento
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
