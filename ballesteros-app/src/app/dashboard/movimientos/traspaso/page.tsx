'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, ArrowRight, DollarSign, Store, Building2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface FormData {
  monto: string
  fecha: string
  cuenta_origen_id: string
  cuenta_destino_id: string
  referencia: string
}

interface CuentaData {
  id: number
  nombre: string
  tipo_cuenta: string
  empresa_asociada?: string
  saldo_actual: number
}

export default function TraspasoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [cuentas, setCuentas] = useState<CuentaData[]>([])
  const [empresaActiva, setEmpresaActiva] = useState<number>(1)
  const [nombreEmpresa, setNombreEmpresa] = useState<string>('')
  const [empresasDisponibles, setEmpresasDisponibles] = useState<Array<{id: number, nombre: string}>>([])

  // Función helper para obtener fecha local en formato datetime-local
  const getFechaLocal = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  const [formData, setFormData] = useState<FormData>({
    monto: '',
    fecha: getFechaLocal(),
    cuenta_origen_id: '',
    cuenta_destino_id: '',
    referencia: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const cargarEmpresas = async () => {
    try {
      const response = await fetch('/api/empresas')
      if (!response.ok) throw new Error('Error al cargar empresas')
      const data = await response.json()

      const empresas = data.empresas || []
      setEmpresasDisponibles(empresas)

      if (empresas.length > 0) {
        setEmpresaActiva(empresas[0].id)
        setNombreEmpresa(empresas[0].nombre)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar empresas')
    }
  }

  const cargarCuentas = async () => {
    try {
      const response = await fetch(`/api/cuentas?empresa_id=${empresaActiva}`)
      if (!response.ok) throw new Error('Error al cargar cuentas')
      const data = await response.json()
      setCuentas(data.cuentas || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar cuentas')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    cargarEmpresas()
  }, [])

  useEffect(() => {
    if (empresaActiva) {
      cargarCuentas()
    }
  }, [empresaActiva])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleEmpresaChange = (empresaId: string) => {
    const id = parseInt(empresaId)
    setEmpresaActiva(id)
    const empresa = empresasDisponibles.find(e => e.id === id)
    if (empresa) {
      setNombreEmpresa(empresa.nombre)
    }

    // Limpiar selecciones de cuentas cuando cambia empresa
    setFormData(prev => ({
      ...prev,
      cuenta_origen_id: '',
      cuenta_destino_id: ''
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0'
    }

    if (!formData.cuenta_origen_id) {
      newErrors.cuenta_origen_id = 'Selecciona la cuenta origen'
    }

    if (!formData.cuenta_destino_id) {
      newErrors.cuenta_destino_id = 'Selecciona la cuenta destino'
    }

    if (formData.cuenta_origen_id === formData.cuenta_destino_id) {
      newErrors.cuenta_destino_id = 'La cuenta destino debe ser diferente a la origen'
    }

    // Verificar que la cuenta origen tenga suficiente saldo
    if (formData.cuenta_origen_id && formData.monto) {
      const cuentaOrigen = cuentas.find(c => c.id.toString() === formData.cuenta_origen_id)
      if (cuentaOrigen && parseFloat(formData.monto) > cuentaOrigen.saldo_actual) {
        newErrors.monto = `Saldo insuficiente. Saldo actual: $${cuentaOrigen.saldo_actual.toFixed(2)}`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario')
      return
    }

    setLoading(true)

    try {
      // Preparar datos para el API
      const movimientoData = {
        tipo_movimiento: 'traspaso',
        monto: parseFloat(formData.monto),
        fecha: formData.fecha,
        empresa_id: empresaActiva,
        cuenta_origen_id: parseInt(formData.cuenta_origen_id),
        cuenta_destino_id: parseInt(formData.cuenta_destino_id),
        referencia: formData.referencia.trim() || null,
        es_traspaso: true
      }

      const response = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movimientoData)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Traspaso de $${parseFloat(formData.monto).toFixed(2)} registrado exitosamente`)
        router.push('/dashboard/movimientos')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al registrar traspaso')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const cuentaOrigen = cuentas.find(c => c.id.toString() === formData.cuenta_origen_id)
  const cuentaDestino = cuentas.find(c => c.id.toString() === formData.cuenta_destino_id)

  if (loadingData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/movimientos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Movimientos
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <ArrowRight className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registrar Traspaso</h1>
            <p className="text-gray-600">Transfiere dinero entre cuentas</p>
          </div>
        </div>

        {/* Selector de Empresa */}
        <div className="ml-auto">
          <Select value={empresaActiva.toString()} onValueChange={handleEmpresaChange}>
            <SelectTrigger className="w-48">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {empresasDisponibles.map((empresa) => (
                <SelectItem key={empresa.id} value={empresa.id.toString()}>
                  {empresa.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Información del Traspaso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Detalles del Traspaso
              </CardTitle>
              <CardDescription>
                Especifica el monto y fecha del traspaso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="monto">Monto a Traspasar *</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.monto}
                  onChange={(e) => handleInputChange('monto', e.target.value)}
                  placeholder="0.00"
                  className={errors.monto ? 'border-red-500' : ''}
                />
                {errors.monto && (
                  <p className="text-sm text-red-600 mt-1">{errors.monto}</p>
                )}
              </div>

              <div>
                <Label htmlFor="fecha">Fecha y Hora *</Label>
                <Input
                  id="fecha"
                  type="datetime-local"
                  value={formData.fecha}
                  onChange={(e) => handleInputChange('fecha', e.target.value)}
                  className={errors.fecha ? 'border-red-500' : ''}
                />
                {errors.fecha && (
                  <p className="text-sm text-red-600 mt-1">{errors.fecha}</p>
                )}
              </div>

              <div>
                <Label htmlFor="referencia">Referencia (Opcional)</Label>
                <Textarea
                  id="referencia"
                  value={formData.referencia}
                  onChange={(e) => handleInputChange('referencia', e.target.value)}
                  placeholder="Descripción o concepto del traspaso..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cuentas Origen y Destino */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="h-5 w-5 text-blue-600" />
                Cuentas del Traspaso
              </CardTitle>
              <CardDescription>
                Selecciona las cuentas origen y destino
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cuenta_origen">Cuenta Origen *</Label>
                <Select value={formData.cuenta_origen_id} onValueChange={(value) => handleInputChange('cuenta_origen_id', value)}>
                  <SelectTrigger className={errors.cuenta_origen_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecciona cuenta origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentas.map((cuenta) => (
                      <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                        <div className="flex justify-between items-center w-full">
                          <span>{cuenta.nombre}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ${cuenta.saldo_actual.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cuenta_origen_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.cuenta_origen_id}</p>
                )}
                {cuentaOrigen && (
                  <p className="text-sm text-gray-600 mt-1">
                    Saldo actual: ${cuentaOrigen.saldo_actual.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center py-2">
                <ArrowRight className="h-6 w-6 text-blue-600" />
              </div>

              <div>
                <Label htmlFor="cuenta_destino">Cuenta Destino *</Label>
                <Select value={formData.cuenta_destino_id} onValueChange={(value) => handleInputChange('cuenta_destino_id', value)}>
                  <SelectTrigger className={errors.cuenta_destino_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecciona cuenta destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentas.map((cuenta) => (
                      <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                        <div className="flex justify-between items-center w-full">
                          <span>{cuenta.nombre}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ${cuenta.saldo_actual.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cuenta_destino_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.cuenta_destino_id}</p>
                )}
                {cuentaDestino && (
                  <p className="text-sm text-gray-600 mt-1">
                    Saldo actual: ${cuentaDestino.saldo_actual.toFixed(2)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen del Traspaso */}
        {formData.monto && cuentaOrigen && cuentaDestino && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Traspaso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cuentaOrigen.nombre}</span>
                    <span className="text-gray-500">
                      (${cuentaOrigen.saldo_actual.toFixed(2)})
                    </span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-600" />
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cuentaDestino.nombre}</span>
                    <span className="text-gray-500">
                      (${cuentaDestino.saldo_actual.toFixed(2)})
                    </span>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <span className="text-2xl font-bold text-blue-600">
                    ${parseFloat(formData.monto).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href="/dashboard/movimientos">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Registrar Traspaso
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}