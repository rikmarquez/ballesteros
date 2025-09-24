'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Search, Building2, Phone, User, Edit, ShoppingCart, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ClienteData {
  id: number
  nombre: string
  telefono: string | null
  activo: boolean
  created_at: string
  empresas: {
    empresa_id: number
    empresa_nombre: string
    tipo_relacion: string
  }[]
  contadores?: {
    movimientos_como_cliente: number
  }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroActivo, setFiltroActivo] = useState<string>('all')

  const cargarClientes = async () => {
    try {
      // setLoading(true) // Comentado para mejor UX

      const params = new URLSearchParams()
      // if (search) params.set('search', search) // COMENTADO: solo filtrado frontend
      if (filtroActivo !== 'all') params.set('activo', filtroActivo === 'activo' ? 'true' : 'false')

      const response = await fetch(`/api/clientes?${params}`)

      if (!response.ok) {
        throw new Error('Error al cargar clientes')
      }

      const data = await response.json()
      setClientes(data.clientes)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarClientes()
  }, [filtroActivo]) // Solo filtros, NO search

  useEffect(() => {
    cargarClientes()
  }, []) // Carga inicial

  const clientesFiltrados = clientes.filter(cliente => {
    const matchesSearch = search === '' ||
      cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (cliente.telefono && cliente.telefono.includes(search))

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
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/catalogos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Catálogos
          </Button>
        </Link>
        <div className="flex items-center justify-between flex-1">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
              <p className="text-gray-600">Gestión de clientes y relaciones comerciales</p>
            </div>
          </div>
          <Link href="/dashboard/clientes/nuevo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filtroActivo === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroActivo('all')}
              >
                Todos ({clientes.length})
              </Button>
              <Button
                variant={filtroActivo === 'true' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroActivo('true')}
              >
                Activos ({clientes.filter(c => c.activo).length})
              </Button>
              <Button
                variant={filtroActivo === 'false' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroActivo('false')}
              >
                Inactivos ({clientes.filter(c => !c.activo).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clientes Grid */}
      {clientes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {search || filtroActivo !== 'all'
                  ? 'No se encontraron clientes con los filtros aplicados'
                  : 'No hay clientes registrados'
                }
              </p>
              {!search && filtroActivo === 'all' && (
                <Link href="/dashboard/clientes/nuevo">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Cliente
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cliente.nombre}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={cliente.activo ? 'default' : 'secondary'}>
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Información de contacto */}
                <div className="space-y-2 text-sm">
                  {cliente.telefono && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{cliente.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>Desde {new Date(cliente.created_at).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>

                {/* Estadísticas */}
                {cliente.contadores && (
                  <div className="pt-3 border-t">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <strong>Transacciones:</strong> {cliente.contadores.movimientos_como_cliente}
                      </div>
                    </div>
                  </div>
                )}

                {/* Empresas asociadas */}
                {cliente.empresas && cliente.empresas.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="text-xs text-gray-600 mb-2">
                      <strong>Empresas:</strong>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cliente.empresas.slice(0, 2).map((empresa, index) => (
                        <Badge key={`${empresa.empresa_id}-${index}`} variant="outline" className="text-xs">
                          {empresa.empresa_nombre}
                        </Badge>
                      ))}
                      {cliente.empresas.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{cliente.empresas.length - 2} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="pt-4 border-t">
                  <Link href={`/dashboard/clientes/${cliente.id}/editar`}>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}