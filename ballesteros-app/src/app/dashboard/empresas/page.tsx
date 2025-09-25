'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Plus, Search, Edit, ArrowLeft, Users, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface EmpresaData {
  id: number
  nombre: string
  activa: boolean
  created_at?: string
  _count?: {
    entidades_empresas: number
    cortes: number
    movimientos: number
    cuentas: number
    saldos: number
  }
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<EmpresaData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroActivo, setFiltroActivo] = useState<string>('all')

  const cargarEmpresas = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroActivo !== 'all') params.set('activa', filtroActivo === 'activo' ? 'true' : 'false')

      const response = await fetch(`/api/empresas?${params}`)
      if (!response.ok) throw new Error('Error al cargar empresas')

      const data = await response.json()
      setEmpresas(data.empresas)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar empresas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarEmpresas()
  }, [filtroActivo])

  useEffect(() => {
    cargarEmpresas()
  }, [])

  const empresasFiltradas = empresas.filter(empresa => {
    const matchesSearch = search === '' ||
      empresa.nombre.toLowerCase().includes(search.toLowerCase())

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/catalogos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Catálogos
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Empresas del Grupo</h1>
        </div>

        <Link href="/dashboard/empresas/nueva">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Empresa
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar empresas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por Estado */}
            <Select value={filtroActivo} onValueChange={setFiltroActivo}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                <SelectItem value="activo">Solo Activas</SelectItem>
                <SelectItem value="inactivo">Solo Inactivas</SelectItem>
              </SelectContent>
            </Select>

            {/* Estadísticas */}
            <div className="flex items-center justify-end text-sm text-gray-600">
              <Building2 className="h-4 w-4 mr-2" />
              {empresasFiltradas.length} empresas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Empresas */}
      {empresasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || filtroActivo !== 'all' ? 'No se encontraron empresas' : 'No hay empresas registradas'}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {search || filtroActivo !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza registrando tu primera empresa del grupo'
              }
            </p>
            {!search && filtroActivo === 'all' && (
              <Link href="/dashboard/empresas/nueva">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primera Empresa
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresasFiltradas.map((empresa) => (
            <Card key={empresa.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{empresa.nombre}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={empresa.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {empresa.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <Link href={`/dashboard/empresas/${empresa.id}/editar`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Información básica */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">ID de la empresa:</p>
                  <p className="font-mono text-sm bg-gray-50 px-2 py-1 rounded">{empresa.id}</p>
                </div>

                {/* Estadísticas */}
                {empresa._count && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Estadísticas</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Entidades:</span>
                        <Badge variant="outline" className="text-xs">
                          {empresa._count.entidades_empresas}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Movimientos:</span>
                        <Badge variant="outline" className="text-xs">
                          {empresa._count.movimientos}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Cortes:</span>
                        <Badge variant="outline" className="text-xs">
                          {empresa._count.cortes}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Cuentas:</span>
                        <Badge variant="outline" className="text-xs">
                          {empresa._count.cuentas}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fecha de creación */}
                {empresa.created_at && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500">
                      Registrada: {new Date(empresa.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Información adicional */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              <strong>Sistema Multi-Empresa:</strong> Cada empresa maneja sus propios cortes, movimientos y cuentas de manera independiente.
            </p>
            <p>
              Las entidades (empleados, clientes, proveedores) pueden estar asociadas a múltiples empresas del grupo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}