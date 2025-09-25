'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Layers, Tags } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

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

export default function NuevaSubcategoriaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<CategoriaData[]>([])
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

  useEffect(() => {
    cargarCategorias()
  }, [])

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

    setLoading(true)

    try {
      const response = await fetch('/api/subcategorias', {
        method: 'POST',
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
        throw new Error(errorData.error || 'Error al crear subcategoría')
      }

      toast.success('Subcategoría creada exitosamente')
      router.push('/dashboard/subcategorias')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear subcategoría')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const categoriaSeleccionada = categorias.find(c => c.id.toString() === formData.categoria_id)

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
          <h1 className="text-2xl font-bold text-gray-900">Nueva Subcategoría</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-orange-600" />
              Información de la Subcategoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Categoría Padre */}
              <div className="space-y-2">
                <Label htmlFor="categoria_id">
                  Categoría Padre <span className="text-red-500">*</span>
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
                {categoriaSeleccionada && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">Categoría seleccionada:</p>
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
              <div className="flex items-center justify-end gap-3 pt-6">
                <Link href="/dashboard/subcategorias">
                  <Button type="button" variant="outline" disabled={loading}>
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={loading || !formData.nombre.trim() || !formData.categoria_id}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Crear Subcategoría
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}