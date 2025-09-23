'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  Phone,
  Briefcase,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Empleado {
  id: number
  nombre: string
  telefono: string | null
  puesto: string | null
  puede_operar_caja: boolean
  activo: boolean
  created_at: string
  // Contadores para mostrar actividad
  contadores?: {
    movimientos_como_empleado: number
    cortes: number
  }
}

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroActivo, setFiltroActivo] = useState<'all' | 'activo' | 'inactivo'>('all')

  const cargarEmpleados = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filtroActivo !== 'all') params.set('activo', filtroActivo === 'activo' ? 'true' : 'false')

      const response = await fetch(`/api/empleados?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEmpleados(data.empleados || [])
      } else {
        toast.error('Error al cargar empleados')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarEmpleados()
  }, [search, filtroActivo])

  const handleEliminar = async (empleadoId: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres desactivar a ${nombre}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/empleados/${empleadoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Empleado desactivado exitosamente')
        cargarEmpleados()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al desactivar empleado')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al conectar con el servidor')
    }
  }

  const empleadosFiltrados = empleados.filter(empleado => {
    const matchesSearch = search === '' ||
      empleado.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (empleado.telefono && empleado.telefono.includes(search)) ||
      (empleado.puesto && empleado.puesto.toLowerCase().includes(search.toLowerCase()))

    return matchesSearch
  })

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/catalogos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Catálogos
          </Button>
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between flex-1">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
              <p className="text-gray-600">Gestión de empleados y cajeras</p>
            </div>
          </div>

          <Link href="/dashboard/empleados/nuevo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar Empleado
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, teléfono o puesto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro de estado */}
            <div className="flex gap-2">
              <Button
                variant={filtroActivo === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroActivo('all')}
              >
                Todos
              </Button>
              <Button
                variant={filtroActivo === 'activo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroActivo('activo')}
              >
                Activos
              </Button>
              <Button
                variant={filtroActivo === 'inactivo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroActivo('inactivo')}
              >
                Inactivos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de empleados */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          </CardContent>
        </Card>
      ) : empleadosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {search || filtroActivo !== 'all' ? 'No se encontraron empleados' : 'No hay empleados registrados'}
              </h3>
              <p className="text-gray-600 mb-4">
                {search || filtroActivo !== 'all'
                  ? 'Intenta cambiar los filtros de búsqueda'
                  : 'Comienza agregando tu primer empleado'
                }
              </p>
              {(!search && filtroActivo === 'all') && (
                <Link href="/dashboard/empleados/nuevo">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Primer Empleado
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empleadosFiltrados.map((empleado) => (
            <Card key={empleado.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {empleado.nombre}
                      {empleado.activo ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </CardTitle>
                    {empleado.puesto && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Briefcase className="h-3 w-3" />
                        {empleado.puesto}
                      </CardDescription>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Link href={`/dashboard/empleados/${empleado.id}/editar`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    {empleado.activo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminar(empleado.id, empleado.nombre)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Información de contacto */}
                  {empleado.telefono && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3 w-3" />
                      {empleado.telefono}
                    </div>
                  )}

                  {/* Badges de permisos */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={empleado.activo ? "default" : "secondary"}>
                      {empleado.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {empleado.puede_operar_caja && (
                      <Badge variant="outline" className="text-green-700 border-green-200">
                        Puede operar caja
                      </Badge>
                    )}
                  </div>

                  {/* Estadísticas de actividad */}
                  {empleado.contadores && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Cortes realizados: {empleado.contadores.cortes}</div>
                        <div>Movimientos: {empleado.contadores.movimientos_como_empleado}</div>
                      </div>
                    </div>
                  )}

                  {/* Fecha de registro */}
                  <div className="text-xs text-gray-400 pt-2 border-t">
                    Registrado: {new Date(empleado.created_at).toLocaleDateString('es-MX')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}