'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NuevaEmpresaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    activa: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast.error('El nombre de la empresa es requerido')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/empresas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          activa: formData.activa
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear empresa')
      }

      toast.success('Empresa creada exitosamente')
      router.push('/dashboard/empresas')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear empresa')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/empresas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Nueva Empresa</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Información de la Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre de la Empresa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Ej: Carnicería Principal, Express, Asadero..."
                  className="w-full"
                  maxLength={100}
                />
                <p className="text-sm text-gray-500">
                  Máximo 100 caracteres ({100 - formData.nombre.length} restantes)
                </p>
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="activa" className="text-base">
                    Estado de la Empresa
                  </Label>
                  <p className="text-sm text-gray-600">
                    Las empresas inactivas no aparecerán en los selectores del sistema
                  </p>
                </div>
                <Switch
                  id="activa"
                  checked={formData.activa}
                  onCheckedChange={(checked) => handleChange('activa', checked)}
                />
              </div>

              {/* Información adicional */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">¿Qué sucede después de crear la empresa?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Se creará automáticamente en el sistema multi-empresa</li>
                  <li>• Podrás asociar empleados, clientes y proveedores a esta empresa</li>
                  <li>• Se podrán crear cortes y movimientos específicos para esta empresa</li>
                  <li>• Se generarán cuentas de efectivo y fiscales independientes</li>
                </ul>
              </div>

              {/* Vista previa */}
              {formData.nombre.trim() && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Vista previa:</h3>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{formData.nombre}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      formData.activa
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {formData.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-6">
                <Link href="/dashboard/empresas">
                  <Button type="button" variant="outline" disabled={loading}>
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={loading || !formData.nombre.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Crear Empresa
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