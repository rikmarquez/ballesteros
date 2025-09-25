'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, DollarSign, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface CuentaData {
  id: number
  tipo_cuenta: string
  nombre: string
  saldo_actual: number
  activa: boolean
  created_at?: string
  _count?: {
    movimientos: number
    movimientos_origen: number
    movimientos_destino: number
  }
}

export default function EditarCuentaPage() {
  const router = useRouter()
  const params = useParams()
  const cuentaId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cuenta, setCuenta] = useState<CuentaData | null>(null)
  const [formData, setFormData] = useState({
    tipo_cuenta: '',
    nombre: '',
    saldo_actual: 0,
    activa: true
  })

  const tiposCuenta = [
    { value: 'efectivo', label: 'Efectivo', description: 'Caja registradora y efectivo en mano' },
    { value: 'fiscal', label: 'Fiscal', description: 'Cuenta bancaria oficial de la empresa' },
    { value: 'banco', label: 'Banco', description: 'Otras cuentas bancarias' }
  ]

  const cargarCuenta = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cuentas/${cuentaId}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Cuenta no encontrada')
          router.push('/dashboard/cuentas')
          return
        }
        throw new Error('Error al cargar cuenta')
      }

      const data = await response.json()
      const cuentaData = data.cuenta

      setCuenta(cuentaData)
      setFormData({
        tipo_cuenta: cuentaData.tipo_cuenta,
        nombre: cuentaData.nombre,
        saldo_actual: cuentaData.saldo_actual,
        activa: cuentaData.activa
      })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar cuenta')
      router.push('/dashboard/cuentas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (cuentaId) {
      cargarCuenta()
    }
  }, [cuentaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.tipo_cuenta) {
      toast.error('Selecciona el tipo de cuenta')
      return
    }

    if (!formData.nombre.trim()) {
      toast.error('El nombre de la cuenta es requerido')
      return
    }

    if (formData.saldo_actual < 0) {
      toast.error('El saldo actual no puede ser negativo')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/cuentas/${cuentaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo_cuenta: formData.tipo_cuenta,
          nombre: formData.nombre.trim(),
          saldo_actual: formData.saldo_actual,
          activa: formData.activa
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar cuenta')
      }

      toast.success('Cuenta actualizada exitosamente')
      router.push('/dashboard/cuentas')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar cuenta')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!cuenta) return

    if (!confirm(`¿Estás seguro de que deseas desactivar la cuenta "${cuenta.nombre}"?`)) {
      return
    }

    const tieneMovimientos = cuenta._count && cuenta._count.movimientos > 0

    if (tieneMovimientos) {
      if (!confirm(
        'Esta cuenta tiene movimientos asociados. ' +
        'Desactivarla ocultará la cuenta pero preservará todos los datos históricos. ' +
        '¿Continuar?'
      )) {
        return
      }
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/cuentas/${cuentaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al desactivar cuenta')
      }

      toast.success('Cuenta desactivada exitosamente')
      router.push('/dashboard/cuentas')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al desactivar cuenta')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const getBadgeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'efectivo':
        return 'bg-green-100 text-green-800'
      case 'fiscal':
        return 'bg-blue-100 text-blue-800'
      case 'banco':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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

  if (!cuenta) {
    return null
  }

  const tieneMovimientos = cuenta._count && cuenta._count.movimientos > 0

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/cuentas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Editar Cuenta</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Información actual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Información Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-lg">{cuenta.nombre}</p>
                <p className="text-sm text-gray-600">ID: {cuenta.id}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Cuenta Transversal:</strong> Recibe dinero de todas las empresas del grupo.
                    La contadora decide cómo distribuir el dinero.
                  </p>
                </div>
                {cuenta.created_at && (
                  <p className="text-xs text-gray-500">
                    Creada: {new Date(cuenta.created_at).toLocaleDateString('es-MX')}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={cuenta.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {cuenta.activa ? 'Activa' : 'Inactiva'}
                </Badge>
                <Badge className={getBadgeColor(cuenta.tipo_cuenta)}>
                  {cuenta.tipo_cuenta.charAt(0).toUpperCase() + cuenta.tipo_cuenta.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Saldo actual */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Saldo Actual</h4>
              <p className={`text-xl font-bold ${cuenta.saldo_actual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cuenta.saldo_actual)}
              </p>
            </div>

            {/* Estadísticas */}
            {cuenta._count && (
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Movimientos Asociados</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{cuenta._count.movimientos_origen}</div>
                    <div className="text-gray-500">Como origen</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{cuenta._count.movimientos_destino}</div>
                    <div className="text-gray-500">Como destino</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">{cuenta._count.movimientos}</div>
                    <div className="text-gray-500">Total</div>
                  </div>
                </div>
              </div>
            )}

            {tieneMovimientos && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Esta cuenta tiene movimientos asociados. Al desactivarla se ocultará de los selectores
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
              {/* Tipo de Cuenta */}
              <div className="space-y-2">
                <Label htmlFor="tipo_cuenta">
                  Tipo de Cuenta <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.tipo_cuenta}
                  onValueChange={(value) => handleChange('tipo_cuenta', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCuenta.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div>
                          <div className="font-medium">{tipo.label}</div>
                          <div className="text-sm text-gray-500">{tipo.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre de la Cuenta <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Ej: Caja Principal, Cuenta Bancaria Banamex, etc."
                  className="w-full"
                  maxLength={100}
                />
                <p className="text-sm text-gray-500">
                  Máximo 100 caracteres ({100 - formData.nombre.length} restantes)
                </p>
              </div>

              {/* Saldo Actual */}
              <div className="space-y-2">
                <Label htmlFor="saldo_actual">
                  Saldo Actual
                </Label>
                <Input
                  id="saldo_actual"
                  type="number"
                  value={formData.saldo_actual}
                  onChange={(e) => handleChange('saldo_actual', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  Ajusta el saldo de la cuenta si es necesario
                </p>
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="activa" className="text-base">
                    Estado de la Cuenta
                  </Label>
                  <p className="text-sm text-gray-600">
                    Las cuentas inactivas no aparecerán en los selectores del sistema
                  </p>
                </div>
                <Switch
                  id="activa"
                  checked={formData.activa}
                  onCheckedChange={(checked) => handleChange('activa', checked)}
                />
              </div>

              {/* Vista previa de cambios */}
              {(formData.nombre !== cuenta.nombre ||
                formData.tipo_cuenta !== cuenta.tipo_cuenta ||
                formData.saldo_actual !== cuenta.saldo_actual ||
                formData.activa !== cuenta.activa) && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Vista previa de cambios:</h3>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formData.nombre}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          formData.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formData.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="capitalize">{formData.tipo_cuenta}</span> • {' '}
                        {formatCurrency(formData.saldo_actual)}
                      </div>
                    </div>
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
                  Desactivar Cuenta
                </Button>

                {/* Botones principales */}
                <div className="flex items-center gap-3">
                  <Link href="/dashboard/cuentas">
                    <Button type="button" variant="outline" disabled={saving}>
                      Cancelar
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving || !formData.tipo_cuenta || !formData.nombre.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white"
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