'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, TrendingDown, CreditCard, Building2, Users, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface FormData {
  tipo_movimiento: string
  monto: string
  fecha: string
  empresa_id: string

  // Campos específicos por tipo
  proveedor_id: string
  cuenta_origen_id: string
  referencia: string
  descripcion: string
  forma_pago: string
}

interface EmpresaData {
  id: number
  nombre: string
}

interface ProveedorData {
  id: number
  nombre: string
  telefono?: string
  email?: string
}

interface CuentaData {
  id: number
  nombre: string
  tipo_cuenta: string
  saldo_actual: number
}

const tiposEgreso = [
  {
    value: 'pago_proveedor',
    label: 'Pago a Proveedor',
    icon: Building2,
    description: 'Pagos a proveedores y acreedores'
  },
  {
    value: 'gasto',
    label: 'Gasto Operativo',
    icon: CreditCard,
    description: 'Gastos generales del negocio'
  },
  {
    value: 'prestamo',
    label: 'Préstamo a Empleado',
    icon: Users,
    description: 'Préstamos y anticipos al personal'
  },
  {
    value: 'compra',
    label: 'Compra de Inventario',
    icon: ShoppingCart,
    description: 'Compras de mercancía e inventario'
  }
]

export default function NuevoEgresoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [empresas, setEmpresas] = useState<EmpresaData[]>([])
  const [proveedores, setProveedores] = useState<ProveedorData[]>([])
  const [cuentas, setCuentas] = useState<CuentaData[]>([])

  const [formData, setFormData] = useState<FormData>({
    tipo_movimiento: '',
    monto: '',
    fecha: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    empresa_id: '',

    // Campos específicos
    proveedor_id: '',
    cuenta_origen_id: '',
    referencia: '',
    descripcion: '',
    forma_pago: 'transferencia'
  })

  // Cargar datos iniciales
  const cargarDatosIniciales = async () => {
    try {
      setLoadingData(true)

      const [empresasRes, proveedoresRes, cuentasRes] = await Promise.all([
        fetch('/api/empresas?activa=true'),
        fetch('/api/entidades?tipo=proveedor&activo=true'),
        fetch('/api/cuentas?activa=true')
      ])

      if (!empresasRes.ok) throw new Error('Error al cargar empresas')
      if (!proveedoresRes.ok) throw new Error('Error al cargar proveedores')
      if (!cuentasRes.ok) throw new Error('Error al cargar cuentas')

      const [empresasData, proveedoresData, cuentasData] = await Promise.all([
        empresasRes.json(),
        proveedoresRes.json(),
        cuentasRes.json()
      ])

      setEmpresas(empresasData.empresas || [])
      setProveedores(proveedoresData.entidades?.filter((e: any) => e.es_proveedor) || [])
      setCuentas(cuentasData.cuentas || [])

      // Seleccionar primera empresa por defecto
      if (empresasData.empresas?.length > 0) {
        setFormData(prev => ({ ...prev, empresa_id: empresasData.empresas[0].id.toString() }))
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos del formulario')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    cargarDatosIniciales()
  }, [])

  // Obtener el tipo seleccionado
  const tipoSeleccionado = tiposEgreso.find(t => t.value === formData.tipo_movimiento)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones básicas
      if (!formData.tipo_movimiento) {
        toast.error('Selecciona un tipo de egreso')
        return
      }

      if (!formData.monto || parseFloat(formData.monto) <= 0) {
        toast.error('Ingresa un monto válido')
        return
      }

      if (!formData.fecha) {
        toast.error('Ingresa una fecha válida')
        return
      }

      // Validaciones específicas para pago a proveedor
      if (formData.tipo_movimiento === 'pago_proveedor') {
        if (!formData.proveedor_id) {
          toast.error('Selecciona un proveedor')
          return
        }
        if (!formData.cuenta_origen_id) {
          toast.error('Selecciona la cuenta de origen')
          return
        }
      }

      // Preparar datos para envío
      const dataToSend = {
        tipo_movimiento: formData.tipo_movimiento,
        es_ingreso: false, // Es un egreso
        monto: parseFloat(formData.monto),
        fecha: formData.fecha,
        empresa_id: formData.empresa_id ? parseInt(formData.empresa_id) : undefined,
        cuenta_origen_id: formData.cuenta_origen_id ? parseInt(formData.cuenta_origen_id) : undefined,
        entidad_relacionada_id: formData.proveedor_id ? parseInt(formData.proveedor_id) : undefined,
        forma_pago: formData.forma_pago || undefined,
        referencia: formData.referencia || undefined,
        // Usar descripción como beneficiario si no hay referencia específica
        beneficiario: formData.descripcion || undefined
      }

      const response = await fetch('/api/movimientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al registrar egreso')
      }

      toast.success('Egreso registrado exitosamente')
      router.push('/dashboard/movimientos')

    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al registrar egreso')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/movimientos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Movimientos
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <TrendingDown className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Registrar Egreso</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Columna 1: Información Básica */}
          <div className="space-y-6">

            {/* Tipo de Egreso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Tipo de Egreso
                </CardTitle>
                <CardDescription>
                  Selecciona el tipo de egreso que deseas registrar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {tiposEgreso.map((tipo) => (
                    <Card
                      key={tipo.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        formData.tipo_movimiento === tipo.value
                          ? 'ring-2 ring-red-500 bg-red-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, tipo_movimiento: tipo.value }))}
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className={`p-2 rounded-lg ${
                          formData.tipo_movimiento === tipo.value ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          <tipo.icon className={`h-5 w-5 ${
                            formData.tipo_movimiento === tipo.value ? 'text-red-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{tipo.label}</h4>
                          <p className="text-sm text-gray-600">{tipo.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>
                  Datos generales del egreso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="monto">Monto *</Label>
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.monto}
                    onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="fecha">Fecha y Hora *</Label>
                  <Input
                    id="fecha"
                    type="datetime-local"
                    value={formData.fecha}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="empresa_id">Empresa</Label>
                  <Select
                    value={formData.empresa_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, empresa_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id.toString()}>
                          {empresa.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna 2: Campos Específicos */}
          <div className="space-y-6">
            {/* Campos dinámicos según el tipo */}
            {formData.tipo_movimiento === 'pago_proveedor' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Pago a Proveedor
                  </CardTitle>
                  <CardDescription>
                    Información específica del pago
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="proveedor_id">Proveedor *</Label>
                    <Select
                      value={formData.proveedor_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, proveedor_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {proveedores.map((proveedor) => (
                          <SelectItem key={proveedor.id} value={proveedor.id.toString()}>
                            <div>
                              <div className="font-medium">{proveedor.nombre}</div>
                              {proveedor.telefono && (
                                <div className="text-xs text-gray-500">{proveedor.telefono}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cuenta_origen_id">Cuenta de Origen *</Label>
                    <Select
                      value={formData.cuenta_origen_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, cuenta_origen_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cuenta desde donde se paga" />
                      </SelectTrigger>
                      <SelectContent>
                        {cuentas.map((cuenta) => (
                          <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                            <div>
                              <div className="font-medium">{cuenta.nombre}</div>
                              <div className="text-xs text-gray-500">
                                Saldo: ${Number(cuenta.saldo_actual || 0).toFixed(2)}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="forma_pago">Forma de Pago</Label>
                    <Select
                      value={formData.forma_pago}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pago: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar forma de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="referencia">Referencia/Folio</Label>
                    <Input
                      id="referencia"
                      placeholder="Número de factura, folio, etc."
                      value={formData.referencia}
                      onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Detalle del pago, concepto, observaciones..."
                      value={formData.descripcion}
                      onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Placeholder para otros tipos */}
            {formData.tipo_movimiento && formData.tipo_movimiento !== 'pago_proveedor' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {tipoSeleccionado?.icon && <tipoSeleccionado.icon className="h-5 w-5 text-blue-600" />}
                    {tipoSeleccionado?.label}
                  </CardTitle>
                  <CardDescription>
                    Próximamente implementaremos este tipo de egreso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🚧</div>
                    <p>Tipo de egreso en desarrollo</p>
                    <p className="text-sm">Por ahora, prueba con "Pago a Proveedor"</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mensaje inicial */}
            {!formData.tipo_movimiento && (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingDown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecciona un tipo de egreso
                  </h3>
                  <p className="text-gray-600">
                    Elige el tipo de egreso arriba para ver los campos específicos
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Botones */}
        {formData.tipo_movimiento && (
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Link href="/dashboard/movimientos">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !formData.tipo_movimiento}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Registrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Registrar Egreso
                </div>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}