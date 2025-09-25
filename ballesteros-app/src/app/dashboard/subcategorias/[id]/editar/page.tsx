'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Layers, Tags, Trash2, AlertTriangle } from 'lucide-react'
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

export default function EditarSubcategoriaPage() {
  const router = useRouter()
  const params = useParams()
  const subcategoriaId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categorias, setCategorias] = useState<CategoriaData[]>([])
  const [subcategoria, setSubcategoria] = useState<SubcategoriaData | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    categoria_id: ''
  })

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

  const cargarSubcategoria = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subcategorias/${subcategoriaId}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Subcategoría no encontrada')
          router.push('/dashboard/subcategorias')
          return
        }
        throw new Error('Error al cargar subcategoría')
      }

      const data = await response.json()
      const subcategoriaData = data.subcategoria

      setSubcategoria(subcategoriaData)
      setFormData({
        nombre: subcategoriaData.nombre,
        categoria_id: subcategoriaData.categoria_id.toString()
      })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar subcategoría')
      router.push('/dashboard/subcategorias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (subcategoriaId) {
      cargarCategorias()
      cargarSubcategoria()
    }
  }, [subcategoriaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    if (!formData.categoria_id) {
      toast.error('Debe seleccionar una categoría')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/subcategorias/${subcategoriaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          categoria_id: parseInt(formData.categoria_id)
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar subcategoría')
      }

      toast.success('Subcategoría actualizada exitosamente')
      router.push('/dashboard/subcategorias')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar subcategoría')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!subcategoria) return

    if (!confirm(`¿Estás seguro de que deseas eliminar la subcategoría "${subcategoria.nombre}"?`)) {
      return
    }

    if (subcategoria._count?.movimientos && subcategoria._count.movimientos > 0) {
      toast.error('No se puede eliminar una subcategoría con movimientos asociados')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/subcategorias/${subcategoriaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar subcategoría')
      }

      toast.success('Subcategoría eliminada exitosamente')
      router.push('/dashboard/subcategorias')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar subcategoría')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const categoriaSeleccionada = categorias.find(c => c.id.toString() === formData.categoria_id)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="max-w-2xl mx-auto">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!subcategoria) {
    return null
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/subcategorias">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Editar Subcategoría</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Información actual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-orange-600" />
              Información Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Categoría actual:</p>
              <div className="flex items-center gap-2">
                <Badge className={tipoColors[subcategoria.categoria.tipo || 'otros']}>
                  {tipoLabels[subcategoria.categoria.tipo || 'otros']}
                </Badge>
                <span className="font-medium">{subcategoria.categoria.nombre}</span>
                {!subcategoria.categoria.activa && (
                  <Badge variant="destructive" className="text-xs">
                    Inactiva
                  </Badge>
                )}
              </div>
            </div>

            {subcategoria._count && subcategoria._count.movimientos > 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Esta subcategoría tiene {subcategoria._count.movimientos} movimiento(s) asociado(s).
                  No se puede eliminar mientras tenga registros vinculados.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario de edición */}
        <Card>
          <CardHeader>
            <CardTitle>Actualizar Información</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Categoría Padre */}
              <div className="space-y-2">
                <Label htmlFor="categoria_id">
                  Nueva Categoría Padre <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.categoria_id}
                  onValueChange={(value) => handleChange('categoria_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${tipoColors[categoria.tipo || 'otros']}`}>
                            {tipoLabels[categoria.tipo || 'otros']}
                          </Badge>
                          {categoria.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoriaSeleccionada && categoriaSeleccionada.id !== subcategoria.categoria_id && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-600">Nueva categoría seleccionada:</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={tipoColors[categoriaSeleccionada.tipo || 'otros']}>
                        {tipoLabels[categoriaSeleccionada.tipo || 'otros']}
                      </Badge>
                      <span className="font-medium">{categoriaSeleccionada.nombre}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre de la Subcategoría <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Ej: Carne de res, Servicios públicos, etc."
                  className="w-full"
                  maxLength={100}
                />
                <p className="text-sm text-gray-500">
                  Máximo 100 caracteres ({100 - formData.nombre.length} restantes)
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-between pt-6">
                {/* Botón de eliminar */}
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving || (subcategoria._count?.movimientos || 0) > 0}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>

                {/* Botones principales */}
                <div className="flex items-center gap-3">
                  <Link href="/dashboard/subcategorias">
                    <Button type="button" variant="outline" disabled={saving}>
                      Cancelar
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving || !formData.nombre.trim() || !formData.categoria_id}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Actualizar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}