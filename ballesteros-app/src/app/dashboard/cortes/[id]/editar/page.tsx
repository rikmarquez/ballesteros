'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Plus, Trash2, Calculator, DollarSign, ShoppingCart, CreditCard, Banknote, Gift, TrendingUp, Wrench, Users } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface MovimientoEfectivo {
  id: string
  tipo: 'venta_efectivo' | 'venta_tarjeta' | 'venta_credito' | 'venta_transferencia' | 'cortesia' | 'cobranza' | 'retiro_parcial' | 'gasto' | 'compra' | 'prestamo' | 'otros_retiros'
  monto: number
  descripcion?: string
  cliente_id?: number | null
  categoria_id?: number | null
  subcategoria_id?: number | null
  relacionado_id?: number | null
  empleado_id?: number | null
  beneficiario?: string
}

interface CorteData {
  id: number
  empresa_id: number
  empleado_id: number
  fecha: string
  sesion: number
  venta_neta: number
  efectivo_real: number
  tags?: string
  movimientos: MovimientoEfectivo[]
  empresa: {
    id: number
    nombre: string
  }
  empleado: {
    id: number
    nombre: string
    puesto: string
  }
}

// Categorías organizadas por tabs - NUEVA ESTRUCTURA SEPARADA POR TIPO DE VENTA
const categoriasMovimientos = {
  venta_efectivo: {
    label: 'Efectivo',
    icon: Banknote,
    tipos: ['venta_efectivo'],
    color: 'bg-green-500',
    generaEfectivo: true
  },
  venta_tarjeta: {
    label: 'Tarjeta',
    icon: CreditCard,
    tipos: ['venta_tarjeta'],
    color: 'bg-blue-500',
    generaEfectivo: false
  },
  venta_credito: {
    label: 'Crédito',
    icon: ShoppingCart,
    tipos: ['venta_credito'],
    color: 'bg-orange-500',
    generaEfectivo: false
  },
  venta_transferencia: {
    label: 'Transferencia',
    icon: TrendingUp,
    tipos: ['venta_transferencia'],
    color: 'bg-indigo-500',
    generaEfectivo: false
  },
  cortesia: {
    label: 'Cortesías',
    icon: Gift,
    tipos: ['cortesia'],
    color: 'bg-pink-500',
    generaEfectivo: false
  },
  cobranza: {
    label: 'Cobranza',
    icon: Calculator,
    tipos: ['cobranza'],
    color: 'bg-emerald-500',
    generaEfectivo: true
  },
  retiros: {
    label: 'Retiros',
    icon: Banknote,
    tipos: ['retiro_parcial', 'otros_retiros'],
    color: 'bg-amber-500',
    generaEfectivo: false
  },
  gastos: {
    label: 'Gastos',
    icon: Wrench,
    tipos: ['gasto'],
    color: 'bg-red-500',
    generaEfectivo: false
  },
  compras: {
    label: 'Compras',
    icon: ShoppingCart,
    tipos: ['compra'],
    color: 'bg-yellow-500',
    generaEfectivo: false
  },
  prestamos: {
    label: 'Préstamos',
    icon: Users,
    tipos: ['prestamo'],
    color: 'bg-purple-500',
    generaEfectivo: false
  }
}

const tiposMovimiento = [
  { value: 'venta_efectivo', label: 'Venta en Efectivo', categoria: 'venta_efectivo' },
  { value: 'venta_tarjeta', label: 'Venta con Tarjeta', categoria: 'venta_tarjeta' },
  { value: 'venta_credito', label: 'Venta a Crédito', categoria: 'venta_credito' },
  { value: 'venta_transferencia', label: 'Venta por Transferencia', categoria: 'venta_transferencia' },
  { value: 'cortesia', label: 'Cortesía', categoria: 'cortesia' },
  { value: 'cobranza', label: 'Cobranza', categoria: 'cobranza' },
  { value: 'retiro_parcial', label: 'Retiro Parcial', categoria: 'retiros' },
  { value: 'otros_retiros', label: 'Otros Retiros', categoria: 'retiros' },
  { value: 'gasto', label: 'Gasto', categoria: 'gastos' },
  { value: 'compra', label: 'Compra', categoria: 'compras' },
  { value: 'prestamo', label: 'Préstamo a Empleado', categoria: 'prestamos' }
]

export default function EditarCortePage() {
  const params = useParams()
  const router = useRouter()
  const corteId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [corteData, setCorteData] = useState<CorteData | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoEfectivo[]>([])
  const [activeTab, setActiveTab] = useState('venta_efectivo')
  const [clientes, setClientes] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])

  useEffect(() => {
    cargarCorte()
  }, [corteId])

  const cargarCorte = async () => {
    try {
      // Cargar corte y catálogos en paralelo
      const [corteRes, clientesRes, categoriasRes, empleadosRes] = await Promise.all([
        fetch(`/api/cortes/${corteId}`),
        fetch('/api/clientes'),
        fetch('/api/categorias'),
        fetch('/api/empleados?puede_operar_caja=true')
      ])

      if (!corteRes.ok) {
        throw new Error('Error al cargar el corte')
      }

      const corteData = await corteRes.json()
      setCorteData(corteData.corte)
      setMovimientos(corteData.corte.movimientos || [])

      if (clientesRes.ok) {
        const clientesData = await clientesRes.json()
        setClientes(clientesData.clientes || [])
      }

      if (categoriasRes.ok) {
        const categoriasData = await categoriasRes.json()
        setCategorias(categoriasData.categorias || [])
      }

      if (empleadosRes.ok) {
        const empleadosData = await empleadosRes.json()
        setEmpleados(empleadosData.empleados || [])
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar el corte')
      router.push('/dashboard/cortes')
    } finally {
      setLoading(false)
    }
  }

  const agregarMovimiento = (categoria: string, tipo?: string) => {
    const tipoDefault = tipo || categoriasMovimientos[categoria as keyof typeof categoriasMovimientos].tipos[0]
    const nuevoMovimiento: MovimientoEfectivo = {
      id: `nuevo_${Date.now()}`,
      tipo: tipoDefault as any,
      monto: 0,
      descripcion: ''
    }
    setMovimientos([...movimientos, nuevoMovimiento])
  }

  // Obtener movimientos por categoría
  const getMovimientosPorCategoria = (categoria: string) => {
    const tipos = categoriasMovimientos[categoria as keyof typeof categoriasMovimientos]?.tipos || []
    return movimientos.filter(m => tipos.includes(m.tipo))
  }

  // Calcular total por categoría
  const getTotalPorCategoria = (categoria: string) => {
    return getMovimientosPorCategoria(categoria)
      .reduce((sum, m) => sum + m.monto, 0)
  }

  const actualizarMovimiento = (movimientoId: string, campo: keyof MovimientoEfectivo, valor: any) => {
    setMovimientos(movimientos.map(m =>
      m.id === movimientoId ? { ...m, [campo]: valor } : m
    ))
  }

  const eliminarMovimiento = (movimientoId: string) => {
    setMovimientos(movimientos.filter(m => m.id !== movimientoId))
  }

  const calcularTotales = () => {
    // Separar tipos de venta
    const ventaEfectivo = getTotalPorCategoria('venta_efectivo')
    const ventaTarjeta = getTotalPorCategoria('venta_tarjeta')
    const ventaCredito = getTotalPorCategoria('venta_credito')
    const ventaTransferencia = getTotalPorCategoria('venta_transferencia')
    const cortesias = getTotalPorCategoria('cortesia')


    // Ingresos que generan efectivo
    const totalCobranza = getTotalPorCategoria('cobranza')

    // Egresos que reducen efectivo
    const totalEgresos = getTotalPorCategoria('retiros') +
                        getTotalPorCategoria('gastos') +
                        getTotalPorCategoria('compras') +
                        getTotalPorCategoria('prestamos')

    // Ventas que NO generan efectivo (se descuentan de la venta neta)
    const ventasNoEfectivo = ventaTarjeta + ventaCredito + ventaTransferencia + cortesias

    // FÓRMULA CORRECTA: Venta Neta - (Tarjeta + Crédito + Transferencia + Cortesías) + Cobranza - Egresos
    const efectivoEsperado = (corteData?.venta_neta || 0) - ventasNoEfectivo + totalCobranza - totalEgresos

    return {
      ventaEfectivo,
      ventaTarjeta,
      ventaCredito,
      ventaTransferencia,
      cortesias,
      totalCobranza,
      totalEgresos,
      ventasNoEfectivo,
      efectivoEsperado
    }
  }

  const guardarCambios = async () => {
    if (!corteData) return

    setSaving(true)
    try {
      const requestData = {
        venta_neta: corteData.venta_neta,
        tags: corteData.tags,
        movimientos: movimientos.map(m => ({
          ...m,
          monto: Number(m.monto)
        }))
      }

      console.log('Enviando datos al backend:', requestData)

      const response = await fetch(`/api/cortes?id=${corteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        let errorMessage = 'Error al actualizar el corte'
        try {
          const errorData = await response.text()
          console.error('Error response:', response.status, errorData)
          if (errorData) {
            const parsed = JSON.parse(errorData)
            errorMessage = parsed.error || errorMessage
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }

      toast.success('Corte actualizado exitosamente')
      router.push('/dashboard/cortes')
    } catch (error) {
      console.error('Error:', error)
      toast.error(`Error al guardar los cambios: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto)
  }

  const renderMovimiento = (movimiento: MovimientoEfectivo) => {
    const requiereCliente = ['venta_efectivo', 'venta_tarjeta', 'venta_credito', 'venta_transferencia', 'cobranza'].includes(movimiento.tipo)
    const requiereCategoria = ['gasto', 'compra'].includes(movimiento.tipo)
    const requiereEmpleado = ['prestamo'].includes(movimiento.tipo)
    const requiereBeneficiario = ['cortesia'].includes(movimiento.tipo)

    return (
      <div key={movimiento.id} className="bg-white border rounded-lg p-3 hover:bg-gray-50 transition-colors">
        {/* Campos principales en una línea horizontal */}

        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-2">
            <Input
              type="number"
              step="0.01"
              value={movimiento.monto}
              onChange={(e) => actualizarMovimiento(movimiento.id, 'monto', parseFloat(e.target.value) || 0)}
              className="text-sm font-medium"
              placeholder="0.00"
            />
          </div>

          <div className="col-span-3">
            <Input
              value={movimiento.descripcion || ''}
              onChange={(e) => actualizarMovimiento(movimiento.id, 'descripcion', e.target.value)}
              placeholder="Descripción"
              className="text-sm"
            />
          </div>
          {requiereCliente && (
            <div className="col-span-3">
              <Select
                value={movimiento.cliente_id?.toString() || '0'}
                onValueChange={(value) => actualizarMovimiento(movimiento.id, 'cliente_id', value && value !== "0" ? parseInt(value) : null)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sin cliente</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {requiereCategoria && (
            <div className="col-span-2">
              <Select
                value={movimiento.categoria_id?.toString() || '0'}
                onValueChange={(value) => actualizarMovimiento(movimiento.id, 'categoria_id', value && value !== "0" ? parseInt(value) : null)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sin categoría</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {requiereEmpleado && (
            <div className="col-span-3">
              <Select
                value={movimiento.empleado_id?.toString() || '0'}
                onValueChange={(value) => actualizarMovimiento(movimiento.id, 'empleado_id', value && value !== "0" ? parseInt(value) : null)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Empleado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sin empleado</SelectItem>
                  {empleados.map((empleado) => (
                    <SelectItem key={empleado.id} value={empleado.id.toString()}>
                      {empleado.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {requiereBeneficiario && (
            <div className="col-span-3">
              <Input
                value={movimiento.beneficiario || ''}
                onChange={(e) => actualizarMovimiento(movimiento.id, 'beneficiario', e.target.value)}
                placeholder="Beneficiario"
                className="text-sm"
              />
            </div>
          )}

          {/* Botones de acción */}
          <div className="col-span-2 flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                toast.success('Movimiento actualizado')
              }}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => eliminarMovimiento(movimiento.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Cargando corte...</div>
        </div>
      </div>
    )
  }

  if (!corteData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Corte no encontrado</p>
        </div>
      </div>
    )
  }

  const {
    ventaEfectivo,
    ventaTarjeta,
    ventaCredito,
    ventaTransferencia,
    cortesias,
    totalCobranza,
    totalEgresos,
    ventasNoEfectivo,
    efectivoEsperado
  } = calcularTotales()

  // El efectivo real es igual a la venta en efectivo + cobranza
  const efectivoReal = ventaEfectivo + totalCobranza
  const diferencia = efectivoReal - efectivoEsperado

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cortes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Editar Corte #{corteData.id}</h1>
            <p className="text-muted-foreground">
              {corteData.empresa.nombre} • {corteData.empleado.nombre} • {new Date(corteData.fecha).toLocaleDateString('es-MX')}
            </p>
          </div>
        </div>
        <Button onClick={guardarCambios} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Movimientos */}
        <div className="lg:col-span-3 space-y-6">
          {/* Movimientos por Categoría */}
          <Card>
            <CardHeader>
              <CardTitle>Movimientos de Efectivo</CardTitle>
              <CardDescription>
                Organizado por categorías para un mejor control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-10">
                  {Object.entries(categoriasMovimientos).map(([key, categoria]) => {
                    const Icon = categoria.icon
                    const total = getTotalPorCategoria(key)
                    const cantidad = getMovimientosPorCategoria(key).length

                    return (
                      <TabsTrigger key={key} value={key} className="flex flex-col p-2">
                        <div className="flex items-center gap-1">
                          <Icon className="w-4 h-4" />
                          <span className="hidden sm:inline">{categoria.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {cantidad} | {formatearMoneda(total)}
                        </div>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {Object.entries(categoriasMovimientos).map(([key, categoria]) => {
                  const Icon = categoria.icon
                  const movimientosCategoria = getMovimientosPorCategoria(key)
                  const total = getTotalPorCategoria(key)

                  return (
                    <TabsContent key={key} value={key} className="space-y-4 pt-10">
                      {/* Título de la categoría con botón agregar */}
                      <div className="flex items-center justify-between border-b pb-4 mb-8">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 text-white p-1 rounded ${categoria.color}`} />
                          <h3 className="text-lg font-semibold">{categoria.label}</h3>
                          <Badge variant="secondary">
                            {movimientosCategoria.length} movimientos - Total: {formatearMoneda(total)}
                          </Badge>
                        </div>
                        <Button
                          onClick={() => agregarMovimiento(key)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                      </div>

                      {/* Lista de movimientos */}
                      <div className="space-y-2">
                        {movimientosCategoria.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg">
                            <Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No hay movimientos de {categoria.label.toLowerCase()}</p>
                            <p className="text-sm">Haz clic en \"Agregar\" para crear el primer movimiento</p>
                          </div>
                        ) : (
                          movimientosCategoria.map(renderMovimiento)
                        )}
                      </div>
                    </TabsContent>
                  )
                })}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Resumen */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Captura de Venta Neta */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="venta_neta" className="text-sm font-medium">Venta Neta (POS)</Label>
                  <Input
                    id="venta_neta"
                    type="number"
                    step="0.01"
                    value={corteData.venta_neta}
                    onChange={(e) => setCorteData({
                      ...corteData,
                      venta_neta: parseFloat(e.target.value) || 0
                    })}
                    className="mt-1 text-lg font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">+ Cobranza:</span>
                  <span className="font-medium">{formatearMoneda(getTotalPorCategoria('cobranza'))}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">- Tarjetas:</span>
                    <span>{formatearMoneda(ventaTarjeta)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">- Crédito:</span>
                    <span>{formatearMoneda(ventaCredito)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">- Transferencias:</span>
                    <span>{formatearMoneda(ventaTransferencia)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">- Retiros:</span>
                    <span>{formatearMoneda(getTotalPorCategoria('retiros'))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">- Gastos:</span>
                    <span>{formatearMoneda(getTotalPorCategoria('gastos'))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">- Compras:</span>
                    <span>{formatearMoneda(getTotalPorCategoria('compras'))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">- Préstamos:</span>
                    <span>{formatearMoneda(getTotalPorCategoria('prestamos'))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">- Cortesías:</span>
                    <span>{formatearMoneda(getTotalPorCategoria('cortesias'))}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="font-medium">Efectivo Esperado:</span>
                  <span className="font-bold">{formatearMoneda(efectivoEsperado)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Efectivo Real:</span>
                  <span className="font-bold text-green-600">{formatearMoneda(efectivoReal)}</span>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="font-medium">Diferencia:</span>
                  <span className={`font-bold ${
                    diferencia > 0 ? 'text-green-600' :
                    diferencia < 0 ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {diferencia > 0 ? '+' : ''}{formatearMoneda(diferencia)}
                  </span>
                </div>

                {Math.abs(diferencia) > 50 && (
                  <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Atención:</strong> La diferencia supera la tolerancia de $50.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Totales por Tipo de Venta */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Ventas</CardTitle>
              <CardDescription>Desglose por forma de pago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded bg-green-100 border border-green-200">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-green-700" />
                    <span className="font-medium text-green-800">Efectivo Real</span>
                  </div>
                  <span className="text-lg font-bold text-green-700">
                    {formatearMoneda(efectivoReal)}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground px-2">
                  Venta Efectivo: {formatearMoneda(ventaEfectivo)} + Cobranza: {formatearMoneda(totalCobranza)}
                </div>

                <Separator className="my-2" />

                <div className="flex items-center justify-between p-2 rounded bg-green-50">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Venta Efectivo</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    {formatearMoneda(ventaEfectivo)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-blue-50">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Tarjeta</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    {formatearMoneda(ventaTarjeta)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-orange-50">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Crédito</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">
                    {formatearMoneda(ventaCredito)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-indigo-50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium">Transferencia</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">
                    {formatearMoneda(ventaTransferencia)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-pink-50">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-pink-600" />
                    <span className="text-sm font-medium">Cortesías</span>
                  </div>
                  <span className="text-sm font-bold text-pink-600">
                    {formatearMoneda(cortesias)}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-2 rounded bg-emerald-50">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">Cobranza</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    {formatearMoneda(totalCobranza)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-red-50">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">Egresos</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    {formatearMoneda(totalEgresos)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado del Corte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Estado del Corte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant={
                  diferencia > 50 ? 'default' :
                  diferencia < -50 ? 'destructive' :
                  'secondary'
                } className="w-full justify-center py-2">
                  {diferencia > 50 ? 'Sobrante' :
                   diferencia < -50 ? 'Faltante' :
                   'Cuadrado'}
                </Badge>

                {diferencia < -50 && (
                  <Badge variant="destructive" className="w-full justify-center py-2">
                    Genera Adeudo
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}