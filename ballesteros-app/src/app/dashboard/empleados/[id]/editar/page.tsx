'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Users, Save, AlertCircle, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface EmpleadoData {
  id: number
  nombre: string
  telefono: string | null
  puesto: string | null
  puede_operar_caja: boolean
  activo: boolean
  created_at: string
  empresas: {
    empresa_id: number
    empresa_nombre: string
    tipo_relacion: string
  }[]
  saldos_por_empresa?: {
    empresa_id: number
    empresa_nombre: string
    tipo_saldo: string
    saldo_actual: number
  }[]
  contadores?: {
    movimientos_como_empleado: number
    cortes: number
  }
}

export default function EditarEmpleadoPage() {
  const params = useParams()
  const router = useRouter()
  const empleadoId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const [empleadoData, setEmpleadoData] = useState<EmpleadoData | null>(null)

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    puesto: '',
    puede_operar_caja: false,
    activo: true,
    saldo_inicial: ''
  })

  const cargarEmpleado = async () => {
    try {
      setLoadingData(true)
      const response = await fetch(`/api/empleados/${empleadoId}`)

      if (!response.ok) {
        throw new Error('Empleado no encontrado')
      }

      const data = await response.json()
      setEmpleadoData(data.empleado)

      // Inicializar formulario con datos existentes
      setFormData({
        nombre: data.empleado.nombre,
        telefono: data.empleado.telefono || '',
        puesto: data.empleado.puesto || '',
        puede_operar_caja: data.empleado.puede_operar_caja,
        activo: data.empleado.activo,
        saldo_inicial: ''
      })

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar empleado')
      router.push('/dashboard/empleados')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    cargarEmpleado()
  }, [empleadoId])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Función removida - empleados pertenecen a todas las empresas automáticamente

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones básicas
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    // Los empleados automáticamente pertenecen a todas las empresas

    setIsSubmitting(true)
    try {
      // Preparar datos para enviar al API - formato transparente
      const dataToSend = {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim() || null,
        puesto: formData.puesto.trim() || null,
        puede_operar_caja: formData.puede_operar_caja,
        activo: formData.activo,
        saldo_inicial: formData.saldo_inicial ? parseFloat(formData.saldo_inicial) : 0
        // No enviamos empresas - se mantienen las relaciones existentes automáticamente
      }

      const response = await fetch(`/api/empleados/${empleadoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Empleado ${result.empleado.nombre} actualizado exitosamente`)
        router.push('/dashboard/empleados')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar empleado')
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
            <div className="text-lg">Cargando empleado...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!empleadoData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Empleado no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/empleados">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Empleado</h1>
            <p className="text-gray-600">{empleadoData.nombre}</p>
          </div>
        </div>
      </div>

      {/* Información del registro */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div>
              <strong>Registrado:</strong> {new Date(empleadoData.created_at).toLocaleDateString('es-MX')}
            </div>
            {empleadoData.contadores && (
              <>
                <div>
                  <strong>Cortes realizados:</strong> {empleadoData.contadores.cortes}
                </div>
                <div>
                  <strong>Movimientos:</strong> {empleadoData.contadores.movimientos_como_empleado}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Saldos por empresa (préstamos) */}
      {empleadoData.saldos_por_empresa && empleadoData.saldos_por_empresa.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Préstamos por Empresa
            </CardTitle>
            <CardDescription>
              Préstamos pendientes del empleado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {empleadoData.saldos_por_empresa.map(saldo => (
                <div key={`${saldo.empresa_id}-${saldo.tipo_saldo}`} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <div className="font-medium text-gray-900">{saldo.empresa_nombre}</div>
                    <div className="text-sm text-gray-600">Préstamo pendiente</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-yellow-600">
                      ${saldo.saldo_actual.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Saldo pendiente</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Nota:</strong> Para ajustar estos préstamos, registra pagos o nuevos préstamos
                desde el módulo de movimientos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Personal</CardTitle>
              <CardDescription>Datos básicos del empleado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Nombre completo del empleado"
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  placeholder="Número de teléfono"
                />
              </div>

              <div>
                <Label htmlFor="puesto">Puesto</Label>
                <Input
                  id="puesto"
                  value={formData.puesto}
                  onChange={(e) => handleInputChange('puesto', e.target.value)}
                  placeholder="Puesto o cargo del empleado"
                />
              </div>

              {/* Mostrar saldo actual si existe */}
              {empleadoData && empleadoData.saldos_por_empresa && empleadoData.saldos_por_empresa.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Label className="text-sm font-medium text-blue-900">Saldo Actual de Préstamos</Label>
                  <div className="mt-2 space-y-2">
                    {empleadoData.saldos_por_empresa.map(saldo => (
                      <div key={`${saldo.empresa_id || 'global'}`} className="flex justify-between items-center">
                        <span className="text-sm text-blue-800">{saldo.empresa_nombre}</span>
                        <span className="font-medium text-blue-900">${saldo.saldo_actual.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Para ajustar estos saldos, use el campo siguiente o cree un movimiento de "Pago de Empleado"
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="saldo_inicial">Agregar Préstamo Adicional</Label>
                <Input
                  id="saldo_inicial"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.saldo_inicial}
                  onChange={(e) => handleInputChange('saldo_inicial', e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Monto a AGREGAR al saldo actual (se sumará al préstamo existente)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configuración y Permisos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración</CardTitle>
              <CardDescription>Permisos y configuración del empleado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Puede Operar Caja</Label>
                  <p className="text-sm text-gray-600">Permitir realizar cortes de caja</p>
                </div>
                <Switch
                  checked={formData.puede_operar_caja}
                  onCheckedChange={(checked) => handleInputChange('puede_operar_caja', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Estado Activo</Label>
                  <p className="text-sm text-gray-600">El empleado puede usar el sistema</p>
                </div>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => handleInputChange('activo', checked)}
                />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href="/dashboard/empleados">
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