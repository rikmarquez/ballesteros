'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, Plus, Search, Edit, ArrowLeft, Tags } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface CategoriaData {
  id: number
  nombre: string
  tipo: string | null
  activa: boolean
  created_at: string
  _count?: {
    subcategorias: number
    movimientos: number
  }
}

const tipoLabels: Record<string, string> = {
  compra: 'Compra',
  servicio: 'Servicio',
  mantenimiento: 'Mantenimiento',
  personal: 'Personal',
  otros: 'Otros'
}

const tipoColors: Record<string, string> = {
  compra: 'bg-blue-100 text-blue-800',
  servicio: 'bg-green-100 text-green-800',
  mantenimiento: 'bg-yellow-100 text-yellow-800',
  personal: 'bg-purple-100 text-purple-800',
  otros: 'bg-gray-100 text-gray-800'
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterActiva, setFilterActiva] = useState<string>('all')
  const [filterTipo, setFilterTipo] = useState<string>('all')

  const cargarCategorias = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filterActiva !== 'all') params.append('activa', filterActiva)
      if (filterTipo !== 'all') params.append('tipo', filterTipo)
      if (search) params.append('search', search)

      const response = await fetch(`/api/categorias?${params}`)

      if (!response.ok) {
        throw new Error('Error al cargar categorías')
      }

      const data = await response.json()
      setCategorias(data.categorias)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarCategorias()
  }, [search, filterActiva, filterTipo])

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
            <FolderOpen className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Categorías de Gasto</h1>
              <p className="text-gray-600">Gestión de categorías para clasificación de gastos</p>
            </div>
          </div>
          <Link href="/dashboard/categorias/nuevo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Categoría
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
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value))
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterActiva === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterActiva('all')}
              >
                Todas ({categorias.length})
              </Button>
              <Button
                variant={filterActiva === 'true' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterActiva('true')}
              >
                Activas ({categorias.filter(c => c.activa).length})
              </Button>
              <Button
                variant={filterActiva === 'false' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterActiva('false')}
              >
                Inactivas ({categorias.filter(c => !c.activa).length})
              </Button>
            </div>
          </div>

          {/* Filtros por tipo */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={filterTipo === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTipo('all')}
            >
              Todos los tipos
            </Button>
            {Object.entries(tipoLabels).map(([tipo, label]) => (
              <Button
                key={tipo}
                variant={filterTipo === tipo ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterTipo(tipo)}
              >
                {label} ({categorias.filter(c => c.tipo === tipo).length})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categorías Grid */}
      {categorias.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Tags className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {search || filterActiva !== 'all' || filterTipo !== 'all'
                  ? 'No se encontraron categorías con los filtros aplicados'
                  : 'No hay categorías registradas'
                }
              </p>
              {!search && filterActiva === 'all' && filterTipo === 'all' && (
                <Link href="/dashboard/categorias/nuevo">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primera Categoría
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categorias.map((categoria) => (
            <Card key={categoria.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FolderOpen className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{categoria.nombre}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={categoria.activa ? 'default' : 'secondary'}>
                          {categoria.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                        {categoria.tipo && (
                          <Badge className={tipoColors[categoria.tipo] || tipoColors.otros}>
                            {tipoLabels[categoria.tipo] || categoria.tipo}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Información básica */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tags className="h-4 w-4" />
                    <span>Desde {new Date(categoria.created_at).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>

                {/* Estadísticas */}
                {categoria._count && (
                  <div className="pt-3 border-t">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <strong>Subcategorías:</strong> {categoria._count.subcategorias}
                      </div>
                      <div>
                        <strong>Movimientos:</strong> {categoria._count.movimientos}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="pt-4 border-t">
                  <Link href={`/dashboard/categorias/${categoria.id}/editar`}>
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