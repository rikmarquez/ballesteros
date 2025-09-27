'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Truck, Save, AlertCircle, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ProveedorData {
  id: number
  nombre: string
  telefono: string | null
  direccion: string | null
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
    movimientos_como_proveedor: number
  }
}

export default function EditarProveedorPage() {
  const params = useParams()
  const router = useRouter()
  const proveedorId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [empresaActiva, setEmpresaActiva] = useState<number | null>(null)

  const [proveedorData, setProveedorData] = useState<ProveedorData | null>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    activo: true,
    saldo_inicial: ''
  })

  const cargarProveedor = async () => {
    try {
      setLoadingData(true)
      const response = await fetch(`/api/proveedores/${proveedorId}`)

      if (!response.ok) {
        throw new Error('Proveedor no encontrado')
      }

      const data = await response.json()
      setProveedorData(data.proveedor)

      setFormData({
        nombre: data.proveedor.nombre,
        telefono: data.proveedor.telefono || '',
        activo: data.proveedor.activo,
        saldo_inicial: ''
      })

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar proveedor')
      router.push('/dashboard/proveedores')
    } finally {
      setLoadingData(false)
    }
  }

  // Obtener empresa activa del localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const empresaActivaLocal = localStorage.getItem('empresaActiva')
      if (empresaActivaLocal) {
        try {
          const empresa = JSON.parse(empresaActivaLocal)
          setEmpresaActiva(empresa.id)
        } catch (error) {
          console.error('Error parsing empresa activa:', error)
        }
      }
    }
  }, [])

  useEffect(() => {
    cargarProveedor()
  }, [proveedorId])

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
        telefono: formData.telefono.trim() || null,
        activo: formData.activo,
        saldo_inicial: formData.saldo_inicial ? parseFloat(formData.saldo_inicial) : 0,
        empresa_activa_id: empresaActiva // Para saldo inicial específico
      }

      const response = await fetch(`/api/proveedores/${proveedorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Proveedor ${result.proveedor.nombre} actualizado exitosamente`)
        router.push('/dashboard/proveedores')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar proveedor')
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
            <div className="text-lg">Cargando proveedor...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!proveedorData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Proveedor no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/proveedores">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proveedores
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Truck className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Proveedor</h1>
            <p className="text-gray-600">{proveedorData.nombre}</p>
          </div>
        </div>
      </div>

      {/* Información del registro */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div>
              <strong>Registrado:</strong> {new Date(proveedorData.created_at).toLocaleDateString('es-MX')}
            </div>
            {proveedorData.contadores && (
              <div>
                <strong>Movimientos:</strong> {proveedorData.contadores.movimientos_como_proveedor}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Saldos por empresa */}
      {proveedorData.saldos_por_empresa && proveedorData.saldos_por_empresa.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              Saldos por Empresa
            </CardTitle>
            <CardDescription>
              Cuentas por pagar actuales con este proveedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {proveedorData.saldos_por_empresa.map(saldo => (
                <div key={`${saldo.empresa_id}-${saldo.tipo_saldo}`} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <div className="font-medium text-gray-900">{saldo.empresa_nombre}</div>
                    <div className="text-sm text-gray-600">Cuenta por pagar</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">
                      ${saldo.saldo_actual.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Saldo actual</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Nota:</strong> Para ajustar estos saldos, crea un movimiento de "Pago a Proveedor"
                desde el módulo de movimientos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Información del Proveedor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Proveedor</CardTitle>
              <CardDescription>Datos básicos del proveedor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre o Razón Social *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Nombre completo o razón social"
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
                <Label htmlFor="saldo_inicial">Ajustar Saldo Inicial (Deuda Nuestra)</Label>
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
                  Solo completar si se requiere ajustar el saldo inicial de la cuenta por pagar
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración</CardTitle>
              <CardDescription>Estado y configuración del proveedor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Estado Activo</Label>
                  <p className="text-sm text-gray-600">El proveedor puede realizar transacciones</p>
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
          <Link href="/dashboard/proveedores">
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