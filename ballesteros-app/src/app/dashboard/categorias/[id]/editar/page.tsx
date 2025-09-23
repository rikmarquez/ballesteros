'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, FolderOpen, Save, AlertCircle, Tags } from 'lucide-react'
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

const tipoOptions = [
  { value: 'sin-tipo', label: 'Sin tipo específico' },
  { value: 'compra', label: 'Compra' },
  { value: 'servicio', label: 'Servicio' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'personal', label: 'Personal' },
  { value: 'otros', label: 'Otros' }
]

export default function EditarCategoriaPage() {
  const params = useParams()
  const router = useRouter()
  const categoriaId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const [categoriaData, setCategoriaData] = useState<CategoriaData | null>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    activa: true
  })

  const cargarCategoria = async () => {
    try {
      setLoadingData(true)
      const response = await fetch(`/api/categorias/${categoriaId}`)

      if (!response.ok) {
        throw new Error('Categoría no encontrada')
      }

      const data = await response.json()
      setCategoriaData(data.categoria)

      setFormData({
        nombre: data.categoria.nombre,
        tipo: data.categoria.tipo || 'sin-tipo',
        activa: data.categoria.activa
      })

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar categoría')
      router.push('/dashboard/categorias')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    cargarCategoria()
  }, [categoriaId])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setIsSubmitting(true)
    try {
      const dataToSend = {
        nombre: formData.nombre.trim(),
        tipo: formData.tipo === 'sin-tipo' ? undefined : formData.tipo,
        activa: formData.activa
      }

      const response = await fetch(`/api/categorias/${categoriaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Categoría ${result.categoria.nombre} actualizada exitosamente`)
        router.push('/dashboard/categorias')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar categoría')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al conectar con el servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <div className="text-lg">Cargando categoría...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!categoriaData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Categoría no encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/categorias">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Categorías
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Categoría</h1>
            <p className="text-gray-600">{categoriaData.nombre}</p>
          </div>
        </div>
      </div>

      {/* Información del registro */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div>
              <strong>Registrada:</strong> {new Date(categoriaData.created_at).toLocaleDateString('es-MX')}
            </div>
            {categoriaData._count && (
              <>
                <div>
                  <strong>Subcategorías:</strong> {categoriaData._count.subcategorias}
                </div>
                <div>
                  <strong>Movimientos:</strong> {categoriaData._count.movimientos}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Información de la Categoría */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Categoría</CardTitle>
              <CardDescription>Datos básicos de la categoría</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Categoría *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Nombre de la categoría"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tipo">Tipo de Categoría</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => handleInputChange('tipo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </CardContent>
          </Card>

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración</CardTitle>
              <CardDescription>Estado y configuración de la categoría</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Estado Activo</Label>
                  <p className="text-sm text-gray-600">La categoría está disponible para uso</p>
                </div>
                <Switch
                  checked={formData.activa}
                  onCheckedChange={(checked) => handleInputChange('activa', checked)}
                />
              </div>

              {/* Advertencias si tiene registros asociados */}
              {categoriaData._count && categoriaData._count.movimientos > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">⚠️ Advertencia</h4>
                  <p className="text-sm text-yellow-800">
                    Esta categoría tiene {categoriaData._count.movimientos} movimientos asociados.
                    Si la desactivas, no podrá ser seleccionada en nuevos movimientos, pero los existentes no se verán afectados.
                  </p>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href="/dashboard/categorias">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}