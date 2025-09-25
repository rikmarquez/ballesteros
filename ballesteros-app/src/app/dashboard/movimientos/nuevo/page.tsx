'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Save, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface FormData {
  tipo_movimiento: string
  es_ingreso: boolean
  monto: string
  fecha: string
  empresa_id: string
  corte_id: string
  cuenta_origen_id: string
  cuenta_destino_id: string
  entidad_relacionada_id: string
  empleado_responsable_id: string
  categoria_id: string
  subcategoria_id: string
  forma_pago: string
  plataforma: string
  referencia: string
  beneficiario: string
  comision: string
}

interface EmpresaData {
  id: number
  nombre: string
}

interface CuentaData {
  id: number
  nombre: string
  tipo_cuenta: string
  saldo_actual: number
}

interface EntidadData {
  id: number
  nombre: string
  es_cliente: boolean
  es_proveedor: boolean
  es_empleado: boolean
}

interface CategoriaData {
  id: number
  nombre: string
  tipo: string
}

interface SubcategoriaData {
  id: number
  nombre: string
  categoria_id: number
}

interface CorteData {
  id: number
  fecha: string
  sesion: number
  empresa: {
    nombre: string
  }
  empleado: {
    nombre: string
  }
}

const tiposMovimiento = {
  ingresos: [
    { value: 'venta_efectivo', label: 'Venta en Efectivo' },
    { value: 'venta_credito', label: 'Venta a Crédito' },
    { value: 'venta_plataforma', label: 'Venta Plataforma' },
    { value: 'cobranza', label: 'Cobranza' },
    { value: 'deposito_plataforma', label: 'Depósito Plataforma' }
  ],
  egresos: [
    { value: 'venta_tarjeta', label: 'Venta con Tarjeta' },
    { value: 'venta_transferencia', label: 'Venta por Transferencia' },
    { value: 'retiro_parcial', label: 'Retiro Parcial' },
    { value: 'gasto', label: 'Gasto' },
    { value: 'compra', label: 'Compra' },
    { value: 'prestamo', label: 'Préstamo' },
    { value: 'cortesia', label: 'Cortesía' },
    { value: 'otros_retiros', label: 'Otros Retiros' },
    { value: 'pago_proveedor', label: 'Pago a Proveedor' },
    { value: 'comision_plataforma', label: 'Comisión Plataforma' }
  ]
}

export default function NuevoMovimientoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [empresas, setEmpresas] = useState<EmpresaData[]>([])
  const [cuentas, setCuentas] = useState<CuentaData[]>([])
  const [entidades, setEntidades] = useState<EntidadData[]>([])
  const [categorias, setCategorias] = useState<CategoriaData[]>([])
  const [subcategorias, setSubcategorias] = useState<SubcategoriaData[]>([])
  const [cortes, setCortes] = useState<CorteData[]>([])

  const [formData, setFormData] = useState<FormData>({
    tipo_movimiento: '',
    es_ingreso: true,
    monto: '',
    fecha: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    empresa_id: '',
    corte_id: '',
    cuenta_origen_id: '',
    cuenta_destino_id: '',
    entidad_relacionada_id: '',
    empleado_responsable_id: '',
    categoria_id: '',
    subcategoria_id: '',
    forma_pago: '',
    plataforma: '',
    referencia: '',
    beneficiario: '',
    comision: '0'
  })

  // Cargar datos iniciales
  const cargarDatosIniciales = async () => {
    try {
      setLoadingData(true)

      const [empresasRes, cuentasRes, entidadesRes, categoriasRes, subcategoriasRes, cortesRes] = await Promise.all([
        fetch('/api/empresas?activa=true'),
        fetch('/api/cuentas?activa=true'),
        fetch('/api/entidades'),
        fetch('/api/categorias?activo=true'),
        fetch('/api/subcategorias'),
        fetch('/api/cortes?estado=activo&limit=50')
      ])

      if (!empresasRes.ok) throw new Error('Error al cargar empresas')
      if (!cuentasRes.ok) throw new Error('Error al cargar cuentas')
      if (!entidadesRes.ok) throw new Error('Error al cargar entidades')
      if (!categoriasRes.ok) throw new Error('Error al cargar categorías')
      if (!subcategoriasRes.ok) throw new Error('Error al cargar subcategorías')
      if (!cortesRes.ok) throw new Error('Error al cargar cortes')

      const [empresasData, cuentasData, entidadesData, categoriasData, subcategoriasData, cortesData] = await Promise.all([
        empresasRes.json(),
        cuentasRes.json(),
        entidadesRes.json(),
        categoriasRes.json(),
        subcategoriasRes.json(),
        cortesRes.json()
      ])

      setEmpresas(empresasData.empresas || [])
      setCuentas(cuentasData.cuentas || [])
      setEntidades(entidadesData.entidades || [])
      setCategorias(categoriasData.categorias || [])
      setSubcategorias(subcategoriasData.subcategorias || [])
      setCortes(cortesData.cortes || [])

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

  // Filtrar subcategorías por categoría seleccionada
  const subcategoriasFiltradas = subcategorias.filter(
    sub => !formData.categoria_id || sub.categoria_id === parseInt(formData.categoria_id)
  )

  // Filtrar entidades según el tipo de movimiento
  const entidadesFiltradas = entidades.filter(entidad => {
    if (!formData.tipo_movimiento) return true

    const tiposConClientes = ['venta_credito', 'cobranza']
    const tiposConProveedores = ['compra', 'pago_proveedor']
    const tiposConEmpleados = ['prestamo', 'cortesia']

    if (tiposConClientes.includes(formData.tipo_movimiento)) {
      return entidad.es_cliente
    }
    if (tiposConProveedores.includes(formData.tipo_movimiento)) {
      return entidad.es_proveedor
    }
    if (tiposConEmpleados.includes(formData.tipo_movimiento)) {
      return entidad.es_empleado
    }

    return true
  })

  // Todas las cuentas disponibles
  const cuentasFiltradas = cuentas

  // Manejar cambio de tipo de movimiento
  const handleTipoMovimientoChange = (tipo: string) => {
    const esIngreso = tiposMovimiento.ingresos.some(t => t.value === tipo)
    setFormData(prev => ({
      ...prev,
      tipo_movimiento: tipo,
      es_ingreso: esIngreso,
      // Limpiar campos que pueden no aplicar
      entidad_relacionada_id: '',
      plataforma: tipo.includes('plataforma') ? prev.plataforma : '',
      beneficiario: tipo === 'cortesia' ? prev.beneficiario : ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones básicas
      if (!formData.tipo_movimiento) {
        toast.error('Selecciona un tipo de movimiento')
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

      // Preparar datos para envío
      const dataToSend = {
        tipo_movimiento: formData.tipo_movimiento,
        es_ingreso: formData.es_ingreso,
        monto: parseFloat(formData.monto),
        fecha: formData.fecha,
        empresa_id: formData.empresa_id ? parseInt(formData.empresa_id) : undefined,
        corte_id: formData.corte_id ? parseInt(formData.corte_id) : undefined,
        cuenta_origen_id: formData.cuenta_origen_id ? parseInt(formData.cuenta_origen_id) : undefined,
        cuenta_destino_id: formData.cuenta_destino_id ? parseInt(formData.cuenta_destino_id) : undefined,
        entidad_relacionada_id: formData.entidad_relacionada_id ? parseInt(formData.entidad_relacionada_id) : undefined,
        empleado_responsable_id: formData.empleado_responsable_id ? parseInt(formData.empleado_responsable_id) : undefined,
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : undefined,
        subcategoria_id: formData.subcategoria_id ? parseInt(formData.subcategoria_id) : undefined,
        forma_pago: formData.forma_pago || undefined,
        plataforma: formData.plataforma || undefined,
        referencia: formData.referencia || undefined,
        beneficiario: formData.beneficiario || undefined,
        comision: parseFloat(formData.comision) || 0
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
        throw new Error(error.error || 'Error al crear movimiento')
      }

      toast.success('Movimiento registrado exitosamente')
      router.push('/dashboard/movimientos')

    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al registrar movimiento')
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
            {[...Array(8)].map((_, i) => (
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
          <DollarSign className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Registrar Movimiento</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Columna 1: Información Básica */}
          <div className="space-y-6">

            {/* Tipo de Movimiento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {formData.es_ingreso ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  Tipo de Movimiento
                </CardTitle>
                <CardDescription>
                  Selecciona el tipo de movimiento financiero
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={formData.es_ingreso ? 'ingreso' : 'egreso'}
                  onValueChange={(value) => {
                    const esIngreso = value === 'ingreso'
                    setFormData(prev => ({
                      ...prev,
                      es_ingreso: esIngreso,
                      tipo_movimiento: '' // Reset tipo cuando cambia categoría
                    }))
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ingreso" id="ingreso" />
                    <Label htmlFor="ingreso" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Ingreso
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="egreso" id="egreso" />
                    <Label htmlFor="egreso" className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Egreso
                    </Label>
                  </div>
                </RadioGroup>

                <div>
                  <Label htmlFor="tipo_movimiento">Tipo específico *</Label>
                  <Select
                    value={formData.tipo_movimiento}
                    onValueChange={handleTipoMovimientoChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de movimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {(formData.es_ingreso ? tiposMovimiento.ingresos : tiposMovimiento.egresos).map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Monto y Fecha */}
            <Card>
              <CardHeader>
                <CardTitle>Datos del Movimiento</CardTitle>
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

          {/* Columna 2: Detalles Adicionales */}
          <div className="space-y-6">

            {/* Cuentas y Corte */}
            <Card>
              <CardHeader>
                <CardTitle>Relaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cuenta_origen_id">Cuenta Origen</Label>
                  <Select
                    value={formData.cuenta_origen_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cuenta_origen_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cuenta de origen (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentasFiltradas.map((cuenta) => (
                        <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                          {cuenta.nombre} (${Number(cuenta.saldo_actual || 0).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cuenta_destino_id">Cuenta Destino</Label>
                  <Select
                    value={formData.cuenta_destino_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cuenta_destino_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cuenta de destino (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentasFiltradas.map((cuenta) => (
                        <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                          {cuenta.nombre} (${Number(cuenta.saldo_actual || 0).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="corte_id">Corte Asociado</Label>
                  <Select
                    value={formData.corte_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, corte_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Asociar a corte (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {cortes.map((corte) => (
                        <SelectItem key={corte.id} value={corte.id.toString()}>
                          Corte #{corte.id} - {corte.empresa.nombre} - {corte.empleado.nombre} - {corte.fecha}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Entidades y Categorización */}
            <Card>
              <CardHeader>
                <CardTitle>Entidades y Categorización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="entidad_relacionada_id">
                    {formData.tipo_movimiento.includes('cobranza') || formData.tipo_movimiento.includes('venta_credito') ? 'Cliente' :
                     formData.tipo_movimiento.includes('compra') || formData.tipo_movimiento.includes('pago_proveedor') ? 'Proveedor' :
                     formData.tipo_movimiento.includes('prestamo') || formData.tipo_movimiento.includes('cortesia') ? 'Empleado' : 'Entidad Relacionada'}
                  </Label>
                  <Select
                    value={formData.entidad_relacionada_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, entidad_relacionada_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar entidad (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {entidadesFiltradas.map((entidad) => (
                        <SelectItem key={entidad.id} value={entidad.id.toString()}>
                          {entidad.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="empleado_responsable_id">Empleado Responsable</Label>
                  <Select
                    value={formData.empleado_responsable_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, empleado_responsable_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Empleado que realiza (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {entidades.filter(e => e.es_empleado).map((empleado) => (
                        <SelectItem key={empleado.id} value={empleado.id.toString()}>
                          {empleado.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoria_id">Categoría</Label>
                  <Select
                    value={formData.categoria_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value, subcategoria_id: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id.toString()}>
                          {categoria.nombre} ({categoria.tipo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.categoria_id && (
                  <div>
                    <Label htmlFor="subcategoria_id">Subcategoría</Label>
                    <Select
                      value={formData.subcategoria_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subcategoria_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Subcategoría (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategoriasFiltradas.map((subcategoria) => (
                          <SelectItem key={subcategoria.id} value={subcategoria.id.toString()}>
                            {subcategoria.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadatos */}
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="forma_pago">Forma de Pago</Label>
                  <Select
                    value={formData.forma_pago}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pago: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Forma de pago (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo_movimiento.includes('plataforma') && (
                  <div>
                    <Label htmlFor="plataforma">Plataforma</Label>
                    <Select
                      value={formData.plataforma}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, plataforma: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uber_eats">Uber Eats</SelectItem>
                        <SelectItem value="rappi">Rappi</SelectItem>
                        <SelectItem value="didi_food">DiDi Food</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.tipo_movimiento === 'cortesia' && (
                  <div>
                    <Label htmlFor="beneficiario">Beneficiario</Label>
                    <Input
                      id="beneficiario"
                      placeholder="Nombre del beneficiario de la cortesía"
                      value={formData.beneficiario}
                      onChange={(e) => setFormData(prev => ({ ...prev, beneficiario: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="referencia">Referencia/Descripción</Label>
                  <Textarea
                    id="referencia"
                    placeholder="Folio, ticket, descripción adicional..."
                    value={formData.referencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="comision">Comisión</Label>
                  <Input
                    id="comision"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.comision}
                    onChange={(e) => setFormData(prev => ({ ...prev, comision: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Link href="/dashboard/movimientos">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Registrar Movimiento
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}