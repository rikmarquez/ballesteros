'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, FolderOpen, Save } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const tipoOptions = [
  { value: 'sin-tipo', label: 'Sin tipo específico' },
  { value: 'compra', label: 'Compra' },
  { value: 'servicio', label: 'Servicio' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'personal', label: 'Personal' },
  { value: 'otros', label: 'Otros' }
]

export default function NuevaCategoriaPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'sin-tipo',
    activa: true
  })

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

      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Categoría ${result.categoria.nombre} creada exitosamente`)
        router.push('/dashboard/categorias')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear categoría')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al conectar con el servidor')
    } finally {
      setIsSubmitting(false)
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Nueva Categoría de Gasto</h1>
            <p className="text-gray-600">Crear nueva categoría para clasificación de gastos</p>
          </div>
        </div>
      </div>

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
                  placeholder="Ej: Gastos de oficina, Servicios públicos, etc."
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
                <p className="text-sm text-gray-500 mt-1">
                  El tipo ayuda a organizar las categorías por naturaleza del gasto
                </p>
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

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Información útil</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Las categorías organizan los gastos por tipo o naturaleza</li>
                  <li>• Puedes agregar subcategorías más específicas después</li>
                  <li>• Solo las categorías activas aparecen en los formularios</li>
                  <li>• El tipo ayuda a generar reportes agrupados</li>
                </ul>
              </div>
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
                Creando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Crear Categoría
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}