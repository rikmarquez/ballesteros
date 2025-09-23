'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Truck, Plus, Search, Building2, Phone, User, Edit, Package, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ProveedorData {
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
    movimientos_como_proveedor: number
  }
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<ProveedorData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterActivo, setFilterActivo] = useState<string>('all')

  const cargarProveedores = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filterActivo !== 'all') params.append('activo', filterActivo)
      if (search) params.append('search', search)

      const response = await fetch(`/api/proveedores?${params}`)

      if (!response.ok) {
        throw new Error('Error al cargar proveedores')
      }

      const data = await response.json()
      setProveedores(data.proveedores)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarProveedores()
  }, [search, filterActivo])

  // No necesitamos filtrado adicional ya que se hace en el API

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
            <Truck className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
              <p className="text-gray-600">Gestión de proveedores y suministros</p>
            </div>
          </div>
          <Link href="/dashboard/proveedores/nuevo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Proveedor
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
                variant={filterActivo === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterActivo('all')}
              >
                Todos ({proveedores.length})
              </Button>
              <Button
                variant={filterActivo === 'true' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterActivo('true')}
              >
                Activos ({proveedores.filter(p => p.activo).length})
              </Button>
              <Button
                variant={filterActivo === 'false' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterActivo('false')}
              >
                Inactivos ({proveedores.filter(p => !p.activo).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proveedores Grid */}
      {proveedores.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {search || filterActivo !== 'all'
                  ? 'No se encontraron proveedores con los filtros aplicados'
                  : 'No hay proveedores registrados'
                }
              </p>
              {!search && filterActivo === 'all' && (
                <Link href="/dashboard/proveedores/nuevo">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Proveedor
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proveedores.map((proveedor) => (
            <Card key={proveedor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Truck className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{proveedor.nombre}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={proveedor.activo ? 'default' : 'secondary'}>
                          {proveedor.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Información de contacto */}
                <div className="space-y-2 text-sm">
                  {proveedor.telefono && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{proveedor.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>Desde {new Date(proveedor.created_at).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>

                {/* Estadísticas */}
                {proveedor.contadores && (
                  <div className="pt-3 border-t">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <strong>Movimientos:</strong> {proveedor.contadores.movimientos_como_proveedor}
                      </div>
                    </div>
                  </div>
                )}

                {/* Empresas asociadas */}
                {proveedor.empresas && proveedor.empresas.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="text-xs text-gray-600 mb-2">
                      <strong>Empresas:</strong>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {proveedor.empresas.slice(0, 2).map((empresa, index) => (
                        <Badge key={`${empresa.empresa_id}-${index}`} variant="outline" className="text-xs">
                          {empresa.empresa_nombre}
                        </Badge>
                      ))}
                      {proveedor.empresas.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{proveedor.empresas.length - 2} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="pt-4 border-t">
                  <Link href={`/dashboard/proveedores/${proveedor.id}/editar`}>
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