'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FolderOpen, Plus, Search, Edit, ArrowLeft, Tags, Layers } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SubcategoriaData {
  id: number
  nombre: string
  categoria_id: number
  categoria: {
    id: number
    nombre: string
    tipo: string | null
    activa: boolean
  }
  _count?: {
    movimientos: number
  }
}

interface CategoriaData {
  id: number
  nombre: string
  tipo: string | null
  activa: boolean
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

export default function SubcategoriasPage() {
  const [subcategorias, setSubcategorias] = useState<SubcategoriaData[]>([])
  const [categorias, setCategorias] = useState<CategoriaData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('all')

  const cargarCategorias = async () => {
    try {
      const response = await fetch('/api/categorias?activa=true')
      if (!response.ok) throw new Error('Error al cargar categorías')
      const data = await response.json()
      setCategorias(data.categorias)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar categorías')
    }
  }

  const cargarSubcategorias = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroCategoria !== 'all') params.set('categoria_id', filtroCategoria)

      const response = await fetch(`/api/subcategorias?${params}`)
      if (!response.ok) throw new Error('Error al cargar subcategorías')

      const data = await response.json()
      setSubcategorias(data.subcategorias)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar subcategorías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarCategorias()
  }, [])

  useEffect(() => {
    cargarSubcategorias()
  }, [filtroCategoria])

  useEffect(() => {
    cargarSubcategorias()
  }, [])

  const subcategoriasFiltradas = subcategorias.filter(subcategoria => {
    const matchesSearch = search === '' ||
      subcategoria.nombre.toLowerCase().includes(search.toLowerCase()) ||
      subcategoria.categoria.nombre.toLowerCase().includes(search.toLowerCase())

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
          <Layers className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Subcategorías de Gasto</h1>
        </div>

        <Link href="/dashboard/subcategorias/nuevo">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Subcategoría
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
                placeholder="Buscar subcategorías..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por Categoría */}
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id.toString()}>
                    {categoria.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Estadísticas */}
            <div className="flex items-center justify-end text-sm text-gray-600">
              <Tags className="h-4 w-4 mr-2" />
              {subcategoriasFiltradas.length} subcategorías
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Subcategorías */}
      {subcategoriasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || filtroCategoria !== 'all' ? 'No se encontraron subcategorías' : 'No hay subcategorías'}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {search || filtroCategoria !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primera subcategoría de gasto'
              }
            </p>
            {!search && filtroCategoria === 'all' && (
              <Link href="/dashboard/subcategorias/nuevo">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Subcategoría
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subcategoriasFiltradas.map((subcategoria) => (
            <Card key={subcategoria.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-lg">{subcategoria.nombre}</CardTitle>
                  </div>
                  <Link href={`/dashboard/subcategorias/${subcategoria.id}/editar`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Categoría Padre */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Categoría:</p>
                  <div className="flex items-center gap-2">
                    <Badge className={tipoColors[subcategoria.categoria.tipo || 'otros']}>
                      {tipoLabels[subcategoria.categoria.tipo || 'otros']}
                    </Badge>
                    <span className="font-medium">{subcategoria.categoria.nombre}</span>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="border-t pt-3">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Movimientos:</span>
                      <Badge variant="outline">
                        {subcategoria._count?.movimientos || 0}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Estado de la Categoría */}
                {!subcategoria.categoria.activa && (
                  <div className="pt-2">
                    <Badge variant="destructive" className="text-xs">
                      Categoría Inactiva
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}