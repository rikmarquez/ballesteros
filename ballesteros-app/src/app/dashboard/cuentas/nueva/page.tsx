'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NuevaCuentaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

    setLoading(true)

    try {
      const response = await fetch('/api/cuentas', {
        method: 'POST',
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
        throw new Error(errorData.error || 'Error al crear cuenta')
      }

      toast.success('Cuenta creada exitosamente')
      router.push('/dashboard/cuentas')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear cuenta')
    } finally {
      setLoading(false)
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
          <h1 className="text-2xl font-bold text-gray-900">Nueva Cuenta</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Información de la Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información importante */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Cuenta Transversal</h3>
                    <p className="text-sm text-blue-800">
                      Esta cuenta recibirá dinero de <strong>todas las empresas</strong> del grupo.
                      No está ligada a una empresa específica - la contadora decide cómo distribuir el dinero.
                    </p>
                  </div>
                </div>
              </div>

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

              {/* Saldo Inicial */}
              <div className="space-y-2">
                <Label htmlFor="saldo_actual">
                  Saldo Inicial
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
                  Saldo con el que inicia la cuenta (por defecto $0.00)
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

              {/* Información adicional */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Tipos de Cuenta:</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• <strong>EFECTIVO:</strong> Para cajas registradoras y dinero en efectivo</li>
                  <li>• <strong>FISCAL:</strong> Para cuentas bancarias principales</li>
                  <li>• <strong>BANCO:</strong> Para otras cuentas bancarias adicionales</li>
                </ul>
                <p className="text-sm text-green-700 mt-2">
                  💡 <strong>Recuerda:</strong> Los cortes de Express y Principal pueden ir a la misma cuenta.
                </p>
              </div>

              {/* Vista previa */}
              {formData.nombre.trim() && formData.tipo_cuenta && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Vista previa:</h3>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
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
                        {formatCurrency(formData.saldo_actual)} • {' '}
                        <span className="text-blue-600">Transversal (todas las empresas)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-6">
                <Link href="/dashboard/cuentas">
                  <Button type="button" variant="outline" disabled={loading}>
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={loading || !formData.tipo_cuenta || !formData.nombre.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Crear Cuenta
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