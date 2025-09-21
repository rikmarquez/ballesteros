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
  tipo: 'venta_efectivo' | 'cobranza' | 'retiro_parcial' | 'venta_tarjeta' | 'venta_transferencia' | 'gasto' | 'compra' | 'prestamo' | 'cortesia' | 'otros_retiros'
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

// Categorías organizadas por tabs
const categoriasMovimientos = {
  ventas: {
    label: 'Ventas',
    icon: CreditCard,
    tipos: ['venta_efectivo', 'venta_tarjeta', 'venta_transferencia'],
    color: 'bg-green-500'
  },
  cobranza: {
    label: 'Cobranza',
    icon: TrendingUp,
    tipos: ['cobranza'],
    color: 'bg-blue-500'
  },
  cortesias: {
    label: 'Cortesías',
    icon: Gift,
    tipos: ['cortesia'],
    color: 'bg-purple-500'
  },
  retiros: {
    label: 'Retiros',
    icon: Banknote,
    tipos: ['retiro_parcial', 'otros_retiros'],
    color: 'bg-orange-500'
  },
  gastos: {
    label: 'Gastos',
    icon: Wrench,
    tipos: ['gasto'],
    color: 'bg-red-500'
  },
  compras: {
    label: 'Compras',
    icon: ShoppingCart,
    tipos: ['compra'],
    color: 'bg-yellow-500'
  },
  prestamos: {
    label: 'Préstamos',
    icon: Users,
    tipos: ['prestamo'],
    color: 'bg-indigo-500'
  }
}

const tiposMovimiento = [
  { value: 'venta_efectivo', label: 'Venta en Efectivo', categoria: 'ventas' },
  { value: 'venta_tarjeta', label: 'Venta con Tarjeta', categoria: 'ventas' },
  { value: 'venta_transferencia', label: 'Venta por Transferencia', categoria: 'ventas' },
  { value: 'cobranza', label: 'Cobranza', categoria: 'cobranza' },
  { value: 'cortesia', label: 'Cortesía', categoria: 'cortesias' },
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
  const [activeTab, setActiveTab] = useState('ventas')
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
    const totalCobranza = getTotalPorCategoria('cobranza')
    const totalEgresos = getTotalPorCategoria('retiros') +
                        getTotalPorCategoria('gastos') +
                        getTotalPorCategoria('compras') +
                        getTotalPorCategoria('prestamos') +
                        getTotalPorCategoria('cortesias') +
                        getTotalPorCategoria('ventas') - getTotalPorCategoria('ventas') // Solo tarjeta y transferencia

    const efectivoEsperado = (corteData?.venta_neta || 0) + totalCobranza - totalEgresos

    return {
      totalCobranza,
      totalEgresos,
      efectivoEsperado
    }
  }

  const guardarCambios = async () => {
    if (!corteData) return

    setSaving(true)
    try {
      const response = await fetch(`/api/cortes?id=${corteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venta_neta: corteData.venta_neta,
          efectivo_real: corteData.efectivo_real,
          tags: corteData.tags,
          movimientos: movimientos.map(m => ({
            ...m,
            monto: Number(m.monto)
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el corte')
      }

      toast.success('Corte actualizado exitosamente')
      router.push('/dashboard/cortes')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar los cambios')
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
    const requiereCliente = ['venta_efectivo', 'venta_tarjeta', 'venta_transferencia', 'cobranza'].includes(movimiento.tipo)
    const requiereCategoria = ['gasto', 'compra'].includes(movimiento.tipo)
    const requiereEmpleado = ['prestamo'].includes(movimiento.tipo)
    const requiereBeneficiario = ['cortesia'].includes(movimiento.tipo)

    return (
      <div key={movimiento.id} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            {tiposMovimiento.find(t => t.value === movimiento.tipo)?.label}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => eliminarMovimiento(movimiento.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Monto</Label>
            <Input
              type="number"
              step="0.01"
              value={movimiento.monto}
              onChange={(e) => actualizarMovimiento(movimiento.id, 'monto', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Input
              value={movimiento.descripcion || ''}
              onChange={(e) => actualizarMovimiento(movimiento.id, 'descripcion', e.target.value)}
              placeholder="Descripción del movimiento"
            />
          </div>
        </div>

        {/* Campos específicos por tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requiereCliente && (
            <div>
              <Label>Cliente</Label>
              <Select
                value={movimiento.cliente_id?.toString() || ''}
                onValueChange={(value) => actualizarMovimiento(movimiento.id, 'cliente_id', value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin cliente</SelectItem>
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
            <div>
              <Label>Categoría</Label>
              <Select
                value={movimiento.categoria_id?.toString() || ''}
                onValueChange={(value) => actualizarMovimiento(movimiento.id, 'categoria_id', value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
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
            <div>
              <Label>Empleado</Label>
              <Select
                value={movimiento.empleado_id?.toString() || ''}
                onValueChange={(value) => actualizarMovimiento(movimiento.id, 'empleado_id', value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map((empleado) => (
                    <SelectItem key={empleado.id} value={empleado.id.toString()}>
                      {empleado.nombre} - {empleado.puesto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {requiereBeneficiario && (
            <div>
              <Label>Beneficiario</Label>
              <Input
                value={movimiento.beneficiario || ''}
                onChange={(e) => actualizarMovimiento(movimiento.id, 'beneficiario', e.target.value)}
                placeholder="Nombre del beneficiario"
              />
            </div>
          )}
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

  const { totalCobranza, totalEgresos, efectivoEsperado } = calcularTotales()
  const diferencia = corteData.efectivo_real - efectivoEsperado

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
        {/* Información General y Movimientos */}
        <div className="lg:col-span-3 space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="venta_neta">Venta Neta</Label>
                  <Input
                    id="venta_neta"
                    type="number"
                    step="0.01"
                    value={corteData.venta_neta}
                    onChange={(e) => setCorteData({
                      ...corteData,
                      venta_neta: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="efectivo_real">Efectivo Real</Label>
                  <Input
                    id="efectivo_real"
                    type="number"
                    step="0.01"
                    value={corteData.efectivo_real}
                    onChange={(e) => setCorteData({
                      ...corteData,
                      efectivo_real: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Notas</Label>
                <Textarea
                  id="tags"
                  value={corteData.tags || ''}
                  onChange={(e) => setCorteData({
                    ...corteData,
                    tags: e.target.value
                  })}
                  placeholder="Notas adicionales..."
                />
              </div>
            </CardContent>
          </Card>

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
                <TabsList className="grid w-full grid-cols-7">
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
                    <TabsContent key={key} value={key} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          <h3 className="text-lg font-semibold">{categoria.label}</h3>
                          <Badge variant="secondary">
                            Total: {formatearMoneda(total)}
                          </Badge>
                        </div>
                        <Button
                          onClick={() => agregarMovimiento(key)}
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {movimientosCategoria.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No hay movimientos de {categoria.label.toLowerCase()}</p>
                            <p className="text-sm">Agrega el primer movimiento</p>
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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Venta Neta:</span>
                  <span className="font-medium">{formatearMoneda(corteData.venta_neta)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">+ Cobranza:</span>
                  <span className="font-medium">{formatearMoneda(getTotalPorCategoria('cobranza'))}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">- Tarjetas:</span>
                    <span>{formatearMoneda(movimientos.filter(m => m.tipo === 'venta_tarjeta').reduce((s, m) => s + m.monto, 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">- Transferencias:</span>
                    <span>{formatearMoneda(movimientos.filter(m => m.tipo === 'venta_transferencia').reduce((s, m) => s + m.monto, 0))}</span>
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
                  <span className="font-bold">{formatearMoneda(corteData.efectivo_real)}</span>
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

          {/* Totales por Categoría */}
          <Card>
            <CardHeader>
              <CardTitle>Totales por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(categoriasMovimientos).map(([key, categoria]) => {
                  const Icon = categoria.icon
                  const total = getTotalPorCategoria(key)
                  const cantidad = getMovimientosPorCategoria(key).length

                  return (
                    <div key={key} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{categoria.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {cantidad}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">
                        {formatearMoneda(total)}
                      </span>
                    </div>
                  )
                })}
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