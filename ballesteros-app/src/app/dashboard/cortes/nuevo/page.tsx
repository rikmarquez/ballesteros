'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Trash2, Calculator, DollarSign, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Empresa {
  id: number
  nombre: string
  activa: boolean
}

interface Empleado {
  id: number
  nombre: string
  puesto: string
  puede_operar_caja: boolean
  activo: boolean
}

interface Cliente {
  id: number
  nombre: string
  empresa_id: number
}

interface CategoriaGasto {
  id: number
  nombre: string
  tipo: string
  subcategorias?: SubcategoriaGasto[]
}

interface SubcategoriaGasto {
  id: number
  nombre: string
  categoria_id: number
}

interface MovimientoEfectivo {
  id: string
  tipo: 'venta_efectivo' | 'cobranza' | 'retiro_parcial' | 'venta_tarjeta' | 'venta_transferencia' | 'gasto' | 'compra' | 'prestamo' | 'cortesia' | 'otros_retiros'
  monto: number
  cliente_id?: number
  categoria_id?: number
  subcategoria_id?: number
  relacionado_id?: number
  descripcion?: string
  beneficiario?: string // Para cortesías
}

export default function NuevoCorteePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Datos de catálogos
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([])

  // Datos del corte
  const [corteData, setCorteData] = useState({
    empresa_id: '',
    empleado_id: '',
    fecha: new Date().toISOString().split('T')[0],
    sesion: 1,
    venta_neta: 0, // Captura manual del POS
    tags: ''
  })

  // Movimientos del turno
  const [movimientos, setMovimientos] = useState<MovimientoEfectivo[]>([])
  const [efectivoReal, setEfectivoReal] = useState<number>(0)

  // Función para cargar datos de catálogos
  const cargarDatos = async () => {
    try {
      setLoadingData(true)

      const [empresasRes, empleadosRes, categoriasRes] = await Promise.all([
        fetch('/api/empresas?activa=true'),
        fetch('/api/empleados?activo=true&puede_operar_caja=true'),
        fetch('/api/categorias?activa=true&incluir_subcategorias=true')
      ])

      if (empresasRes.ok) {
        const data = await empresasRes.json()
        setEmpresas(data.empresas)
      }

      if (empleadosRes.ok) {
        const data = await empleadosRes.json()
        setEmpleados(data.empleados)
      }

      if (categoriasRes.ok) {
        const data = await categoriasRes.json()
        setCategorias(data.categorias)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar datos de catálogos')
    } finally {
      setLoadingData(false)
    }
  }

  // Cargar clientes cuando se selecciona empresa
  const cargarClientes = async (empresaId: string) => {
    try {
      const response = await fetch(`/api/clientes?empresa_id=${empresaId}`)
      if (response.ok) {
        const data = await response.json()
        setClientes(data.clientes)
      }
    } catch (error) {
      console.error('Error cargando clientes:', error)
    }
  }

  // Cálculos automáticos según el flujo correcto
  const calcularTotales = () => {
    // Entradas de efectivo
    const ventaEfectivo = movimientos.filter(m => m.tipo === 'venta_efectivo').reduce((sum, m) => sum + m.monto, 0)
    const cobranza = movimientos.filter(m => m.tipo === 'cobranza').reduce((sum, m) => sum + m.monto, 0)

    // Salidas de efectivo
    const retirosParciales = movimientos.filter(m => m.tipo === 'retiro_parcial').reduce((sum, m) => sum + m.monto, 0)
    const ventaTarjeta = movimientos.filter(m => m.tipo === 'venta_tarjeta').reduce((sum, m) => sum + m.monto, 0)
    const ventaTransferencia = movimientos.filter(m => m.tipo === 'venta_transferencia').reduce((sum, m) => sum + m.monto, 0)
    const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.monto, 0)
    const compras = movimientos.filter(m => m.tipo === 'compra').reduce((sum, m) => sum + m.monto, 0)
    const prestamos = movimientos.filter(m => m.tipo === 'prestamo').reduce((sum, m) => sum + m.monto, 0)
    const cortesias = movimientos.filter(m => m.tipo === 'cortesia').reduce((sum, m) => sum + m.monto, 0)
    const otrosRetiros = movimientos.filter(m => m.tipo === 'otros_retiros').reduce((sum, m) => sum + m.monto, 0)

    const totalSalidas = retirosParciales + ventaTarjeta + ventaTransferencia + gastos + compras + prestamos + cortesias + otrosRetiros

    // Cálculo principal: Efectivo Esperado = (Venta Neta + Cobranza) - (Todas las salidas)
    const efectivoEsperado = (corteData.venta_neta + cobranza) - totalSalidas
    const diferencia = efectivoReal - efectivoEsperado

    return {
      ventaEfectivo,
      cobranza,
      retirosParciales,
      ventaTarjeta,
      ventaTransferencia,
      gastos,
      compras,
      prestamos,
      cortesias,
      otrosRetiros,
      totalSalidas,
      efectivoEsperado,
      diferencia
    }
  }

  const totales = calcularTotales()

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    if (corteData.empresa_id) {
      cargarClientes(corteData.empresa_id)
    }
  }, [corteData.empresa_id])

  // Funciones para manejar movimientos
  const agregarMovimiento = (tipo: MovimientoEfectivo['tipo']) => {
    const nuevoMovimiento: MovimientoEfectivo = {
      id: Date.now().toString(),
      tipo,
      monto: 0,
      descripcion: ''
    }
    setMovimientos([...movimientos, nuevoMovimiento])
  }

  const eliminarMovimiento = (id: string) => {
    setMovimientos(movimientos.filter(m => m.id !== id))
  }

  const actualizarMovimiento = (id: string, campo: string, valor: any) => {
    setMovimientos(movimientos.map(m => m.id === id ? { ...m, [campo]: valor } : m))
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderInformacionGeneral()
      case 2:
        return renderVentaNeta()
      case 3:
        return renderMovimientosEfectivo()
      case 4:
        return renderResumenFinal()
      default:
        return null
    }
  }

  const renderInformacionGeneral = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Información General del Corte</CardTitle>
        <CardDescription>Datos básicos del corte de caja</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="empresa">Empresa</Label>
            <Select
              value={corteData.empresa_id}
              onValueChange={(value) => setCorteData({...corteData, empresa_id: value})}
              disabled={loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Cargando..." : "Selecciona empresa"} />
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

          <div>
            <Label htmlFor="empleado">Cajera</Label>
            <Select
              value={corteData.empleado_id}
              onValueChange={(value) => setCorteData({...corteData, empleado_id: value})}
              disabled={loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Cargando..." : "Selecciona cajera"} />
              </SelectTrigger>
              <SelectContent>
                {empleados.map((empleado) => (
                  <SelectItem key={empleado.id} value={empleado.id.toString()}>
                    {empleado.nombre} ({empleado.puesto})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={corteData.fecha}
              onChange={(e) => setCorteData({...corteData, fecha: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="sesion">Sesión</Label>
            <Input
              id="sesion"
              type="number"
              min="1"
              value={corteData.sesion}
              onChange={(e) => setCorteData({...corteData, sesion: parseInt(e.target.value)})}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderVentaNeta = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Venta Neta del POS
        </CardTitle>
        <CardDescription>Captura manual del total de ventas reportado por el sistema POS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-md">
          <Label htmlFor="venta_neta">Venta Neta Total (del POS)</Label>
          <Input
            id="venta_neta"
            type="number"
            step="0.01"
            value={corteData.venta_neta}
            onChange={(e) => setCorteData({...corteData, venta_neta: parseFloat(e.target.value) || 0})}
            className="text-lg font-medium"
            placeholder="0.00"
          />
          <p className="text-sm text-gray-500 mt-2">
            Ingresa el total de ventas del día según el reporte del POS
          </p>
        </div>

        {corteData.venta_neta > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Venta Neta Capturada</h3>
            <p className="text-2xl font-bold text-blue-600">
              ${corteData.venta_neta.toFixed(2)}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Esta es la base para calcular el efectivo esperado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderMovimientosEfectivo = () => (
    <div className="space-y-6">
      {/* Entradas de Efectivo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Entradas de Efectivo
          </CardTitle>
          <CardDescription>Movimientos que AUMENTAN el efectivo en caja</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => agregarMovimiento('venta_efectivo')}
              variant="outline"
              className="h-20 flex flex-col gap-2"
            >
              <Plus className="h-5 w-5" />
              <span>Venta en Efectivo</span>
            </Button>
            <Button
              onClick={() => agregarMovimiento('cobranza')}
              variant="outline"
              className="h-20 flex flex-col gap-2"
            >
              <Plus className="h-5 w-5" />
              <span>Cobranza a Clientes</span>
            </Button>
          </div>

          {/* Mostrar entradas */}
          {movimientos.filter(m => ['venta_efectivo', 'cobranza'].includes(m.tipo)).map((movimiento) => (
            <div key={movimiento.id} className="flex gap-4 p-4 border rounded-lg bg-green-50">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={movimiento.tipo}
                    onValueChange={(value) => actualizarMovimiento(movimiento.id, 'tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venta_efectivo">Venta en Efectivo</SelectItem>
                      <SelectItem value="cobranza">Cobranza a Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={movimiento.monto}
                    onChange={(e) => actualizarMovimiento(movimiento.id, 'monto', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {movimiento.tipo === 'cobranza' && (
                  <div>
                    <Label>Cliente</Label>
                    <Select
                      value={movimiento.cliente_id?.toString() || ''}
                      onValueChange={(value) => actualizarMovimiento(movimiento.id, 'cliente_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Descripción</Label>
                  <Input
                    value={movimiento.descripcion || ''}
                    onChange={(e) => actualizarMovimiento(movimiento.id, 'descripcion', e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => eliminarMovimiento(movimiento.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="p-4 bg-green-100 rounded-lg">
            <h4 className="font-medium text-green-800">Total Entradas: ${(totales.ventaEfectivo + totales.cobranza).toFixed(2)}</h4>
          </div>
        </CardContent>
      </Card>

      {/* Salidas de Efectivo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Salidas de Efectivo
          </CardTitle>
          <CardDescription>Movimientos que REDUCEN el efectivo en caja</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => agregarMovimiento('retiro_parcial')}
              variant="outline"
              className="h-16 flex flex-col gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Retiro Parcial</span>
            </Button>
            <Button
              onClick={() => agregarMovimiento('venta_tarjeta')}
              variant="outline"
              className="h-16 flex flex-col gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Venta Tarjeta</span>
            </Button>
            <Button
              onClick={() => agregarMovimiento('venta_transferencia')}
              variant="outline"
              className="h-16 flex flex-col gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Venta Transfer.</span>
            </Button>
            <Button
              onClick={() => agregarMovimiento('gasto')}
              variant="outline"
              className="h-16 flex flex-col gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Gasto</span>
            </Button>
            <Button
              onClick={() => agregarMovimiento('compra')}
              variant="outline"
              className="h-16 flex flex-col gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Compra</span>
            </Button>
            <Button
              onClick={() => agregarMovimiento('prestamo')}
              variant="outline"
              className="h-16 flex flex-col gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Préstamo</span>
            </Button>
            <Button
              onClick={() => agregarMovimiento('cortesia')}
              variant="outline"
              className="h-16 flex flex-col gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Cortesía</span>
            </Button>
            <Button
              onClick={() => agregarMovimiento('otros_retiros')}
              variant="outline"
              className="h-16 flex flex-col gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Otros Retiros</span>
            </Button>
          </div>

          {/* Mostrar salidas */}
          {movimientos.filter(m => !['venta_efectivo', 'cobranza'].includes(m.tipo)).map((movimiento) => (
            <div key={movimiento.id} className="flex gap-4 p-4 border rounded-lg bg-red-50">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={movimiento.tipo}
                    onValueChange={(value) => actualizarMovimiento(movimiento.id, 'tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retiro_parcial">Retiro Parcial</SelectItem>
                      <SelectItem value="venta_tarjeta">Venta Tarjeta</SelectItem>
                      <SelectItem value="venta_transferencia">Venta Transferencia</SelectItem>
                      <SelectItem value="gasto">Gasto</SelectItem>
                      <SelectItem value="compra">Compra</SelectItem>
                      <SelectItem value="prestamo">Préstamo</SelectItem>
                      <SelectItem value="cortesia">Cortesía</SelectItem>
                      <SelectItem value="otros_retiros">Otros Retiros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={movimiento.monto}
                    onChange={(e) => actualizarMovimiento(movimiento.id, 'monto', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {(movimiento.tipo === 'gasto' || movimiento.tipo === 'compra') && (
                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={movimiento.categoria_id?.toString() || ''}
                      onValueChange={(value) => actualizarMovimiento(movimiento.id, 'categoria_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
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

                {movimiento.tipo === 'cortesia' && (
                  <div>
                    <Label>Beneficiario</Label>
                    <Input
                      value={movimiento.beneficiario || ''}
                      onChange={(e) => actualizarMovimiento(movimiento.id, 'beneficiario', e.target.value)}
                      placeholder="¿A quién?"
                    />
                  </div>
                )}

                <div>
                  <Label>Descripción</Label>
                  <Input
                    value={movimiento.descripcion || ''}
                    onChange={(e) => actualizarMovimiento(movimiento.id, 'descripcion', e.target.value)}
                    placeholder="Detalle"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => eliminarMovimiento(movimiento.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="p-4 bg-red-100 rounded-lg">
            <h4 className="font-medium text-red-800">Total Salidas: ${totales.totalSalidas.toFixed(2)}</h4>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderResumenFinal = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cálculo del Efectivo Esperado
          </CardTitle>
          <CardDescription>Fórmula: (Venta Neta + Cobranza) - (Todas las Salidas)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fórmula paso a paso */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Cálculo Paso a Paso</h3>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Base del Cálculo</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Venta Neta (POS):</span>
                    <span className="font-medium">${corteData.venta_neta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+ Cobranza:</span>
                    <span className="font-medium">${totales.cobranza.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 border-blue-200">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-bold">${(corteData.venta_neta + totales.cobranza).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Salidas de Efectivo</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Retiros Parciales:</span>
                    <span>-${totales.retirosParciales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Venta Tarjeta:</span>
                    <span>-${totales.ventaTarjeta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Venta Transferencia:</span>
                    <span>-${totales.ventaTransferencia.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gastos:</span>
                    <span>-${totales.gastos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compras:</span>
                    <span>-${totales.compras.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Préstamos:</span>
                    <span>-${totales.prestamos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cortesías:</span>
                    <span>-${totales.cortesias.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Otros Retiros:</span>
                    <span>-${totales.otrosRetiros.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 border-red-200">
                    <span className="font-medium">Total Salidas:</span>
                    <span className="font-bold">-${totales.totalSalidas.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Efectivo Esperado</h4>
                <div className="text-2xl font-bold text-gray-800">
                  ${totales.efectivoEsperado.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Comparación final */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Comparación Final</h3>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Efectivo Real Entregado</h4>
                <div>
                  <Label htmlFor="efectivo_real">Monto entregado por la cajera</Label>
                  <Input
                    id="efectivo_real"
                    type="number"
                    step="0.01"
                    value={efectivoReal}
                    onChange={(e) => setEfectivoReal(parseFloat(e.target.value) || 0)}
                    className="text-lg font-medium"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {efectivoReal > 0 && (
                <div className={`p-4 rounded-lg ${
                  totales.diferencia >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    totales.diferencia >= 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {totales.diferencia >= 0 ? 'Sobrante' : 'Faltante'}
                  </h4>
                  <div className={`text-2xl font-bold ${
                    totales.diferencia >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${Math.abs(totales.diferencia).toFixed(2)}
                  </div>
                  {Math.abs(totales.diferencia) > 50 && (
                    <p className="text-sm mt-2 text-amber-600">
                      ⚠️ Diferencia mayor a $50 - Se generará adeudo automáticamente
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="mt-6">
            <Label htmlFor="tags">Tags y Observaciones</Label>
            <Textarea
              id="tags"
              value={corteData.tags}
              onChange={(e) => setCorteData({...corteData, tags: e.target.value})}
              placeholder="Ej: turno-matutino, diferencia-menor, revision-pendiente"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const onSubmit = async () => {
    if (!corteData.empresa_id || !corteData.empleado_id) {
      toast.error('Selecciona empresa y empleado')
      return
    }

    if (corteData.venta_neta === 0) {
      toast.error('Ingresa la venta neta del POS')
      return
    }

    if (efectivoReal === 0) {
      toast.error('Ingresa el efectivo real entregado')
      return
    }

    setIsSubmitting(true)
    try {
      const corteCompleto = {
        ...corteData,
        empresa_id: parseInt(corteData.empresa_id),
        empleado_id: parseInt(corteData.empleado_id),
        venta_neta: corteData.venta_neta,
        efectivo_esperado: totales.efectivoEsperado,
        efectivo_real: efectivoReal,
        diferencia: totales.diferencia,
        movimientos
      }

      const response = await fetch('/api/cortes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corteCompleto)
      })

      if (response.ok) {
        const corte = await response.json()
        toast.success(`Corte #${corte.corte.id} creado exitosamente`)
        router.push('/dashboard/cortes')
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al crear corte")
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error("No se pudo conectar con el servidor")
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: "Información General", description: "Datos básicos del corte" },
    { number: 2, title: "Venta Neta", description: "Total del POS" },
    { number: 3, title: "Movimientos de Efectivo", description: "Entradas y salidas" },
    { number: 4, title: "Cálculo Final", description: "Efectivo esperado vs real" }
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/cortes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Corte de Caja</h1>
          <p className="text-gray-600 mt-1">Efectivo Esperado = (Venta Neta + Cobranza) - (Retiros + Tarjetas + Gastos + etc.)</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep === step.number
                  ? 'bg-blue-600 text-white'
                  : currentStep > step.number
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {step.number}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-lg font-medium">{steps[currentStep - 1]?.title}</h2>
          <p className="text-gray-600">{steps[currentStep - 1]?.description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Anterior
        </Button>

        <div className="flex gap-4">
          {currentStep < steps.length ? (
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
              disabled={
                (currentStep === 1 && (!corteData.empresa_id || !corteData.empleado_id)) ||
                (currentStep === 2 && corteData.venta_neta === 0)
              }
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || efectivoReal === 0}
              className="px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Corte Completo'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}