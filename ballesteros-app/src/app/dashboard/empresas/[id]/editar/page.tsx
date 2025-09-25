'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Building2, Trash2, Users, DollarSign, AlertTriangle } from 'lucide-react'
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

export default function EditarEmpresaPage() {
  const router = useRouter()
  const params = useParams()
  const empresaId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    activa: true
  })

  const cargarEmpresa = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/empresas/${empresaId}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Empresa no encontrada')
          router.push('/dashboard/empresas')
          return
        }
        throw new Error('Error al cargar empresa')
      }

      const data = await response.json()
      const empresaData = data.empresa

      setEmpresa(empresaData)
      setFormData({
        nombre: empresaData.nombre,
        activa: empresaData.activa
      })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar empresa')
      router.push('/dashboard/empresas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (empresaId) {
      cargarEmpresa()
    }
  }, [empresaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast.error('El nombre de la empresa es requerido')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/empresas/${empresaId}`, {
        method: 'PUT',
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
        throw new Error(errorData.error || 'Error al actualizar empresa')
      }

      toast.success('Empresa actualizada exitosamente')
      router.push('/dashboard/empresas')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar empresa')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!empresa) return

    if (!confirm(`¿Estás seguro de que deseas desactivar la empresa "${empresa.nombre}"?`)) {
      return
    }

    const tieneMovimientos = empresa._count && (
      empresa._count.cortes > 0 ||
      empresa._count.movimientos > 0 ||
      empresa._count.cuentas > 0 ||
      empresa._count.saldos > 0
    )

    if (tieneMovimientos) {
      if (!confirm(
        'Esta empresa tiene movimientos, cortes o cuentas asociadas. ' +
        'Desactivarla ocultará la empresa pero preservará todos los datos históricos. ' +
        '¿Continuar?'
      )) {
        return
      }
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/empresas/${empresaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al desactivar empresa')
      }

      toast.success('Empresa desactivada exitosamente')
      router.push('/dashboard/empresas')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al desactivar empresa')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

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

  if (!empresa) {
    return null
  }

  const tieneMovimientos = empresa._count && (
    empresa._count.cortes > 0 ||
    empresa._count.movimientos > 0 ||
    empresa._count.cuentas > 0 ||
    empresa._count.saldos > 0
  )

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
          <h1 className="text-2xl font-bold text-gray-900">Editar Empresa</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Información actual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Información Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-lg">{empresa.nombre}</p>
                <p className="text-sm text-gray-600">ID: {empresa.id}</p>
                {empresa.created_at && (
                  <p className="text-xs text-gray-500">
                    Creada: {new Date(empresa.created_at).toLocaleDateString('es-MX')}
                  </p>
                )}
              </div>
              <Badge className={empresa.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {empresa.activa ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>

            {/* Estadísticas */}
            {empresa._count && (
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Datos Asociados</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>Entidades: <strong>{empresa._count.entidades_empresas}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span>Cortes: <strong>{empresa._count.cortes}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>Movimientos: <strong>{empresa._count.movimientos}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>Cuentas: <strong>{empresa._count.cuentas}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {tieneMovimientos && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Esta empresa tiene datos asociados. Al desactivarla se ocultará de los selectores
                  pero se preservarán todos los datos históricos.
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

              {/* Vista previa de cambios */}
              {(formData.nombre !== empresa.nombre || formData.activa !== empresa.activa) && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Vista previa de cambios:</h3>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
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
              <div className="flex items-center justify-between pt-6">
                {/* Botón de desactivar */}
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeactivate}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Desactivar Empresa
                </Button>

                {/* Botones principales */}
                <div className="flex items-center gap-3">
                  <Link href="/dashboard/empresas">
                    <Button type="button" variant="outline" disabled={saving}>
                      Cancelar
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving || !formData.nombre.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
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