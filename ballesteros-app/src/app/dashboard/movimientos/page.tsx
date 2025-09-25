'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Search, Edit, TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface MovimientoData {
  id: number
  tipo_movimiento: string
  es_ingreso: boolean
  monto: number
  fecha: string
  referencia?: string
  beneficiario?: string
  forma_pago?: string
  plataforma?: string
  empresa?: {
    id: number
    nombre: string
  }
  corte?: {
    id: number
    fecha: string
    sesion: number
  }
  cuenta_origen?: {
    id: number
    nombre: string
    tipo_cuenta: string
  }
  cuenta_destino?: {
    id: number
    nombre: string
    tipo_cuenta: string
  }
  entidad_relacionada?: {
    id: number
    nombre: string
    es_cliente: boolean
    es_proveedor: boolean
  }
  empleado_responsable?: {
    id: number
    nombre: string
    puesto: string
  }
  categoria?: {
    id: number
    nombre: string
    tipo: string
  }
  subcategoria?: {
    id: number
    nombre: string
  }
}

interface EmpresaData {
  id: number
  nombre: string
}

const tipoMovimientoLabels: Record<string, string> = {
  // Ingresos
  venta_efectivo: 'Venta Efectivo',
  venta_credito: 'Venta Crédito',
  venta_plataforma: 'Venta Plataforma',
  cobranza: 'Cobranza',
  deposito_plataforma: 'Depósito Plataforma',

  // Egresos
  venta_tarjeta: 'Venta Tarjeta',
  venta_transferencia: 'Venta Transferencia',
  retiro_parcial: 'Retiro Parcial',
  gasto: 'Gasto',
  compra: 'Compra',
  prestamo: 'Préstamo',
  cortesia: 'Cortesía',
  otros_retiros: 'Otros Retiros',
  pago_proveedor: 'Pago Proveedor',
  comision_plataforma: 'Comisión Plataforma'
}

const tipoMovimientoColors: Record<string, string> = {
  // Ingresos - Verde
  venta_efectivo: 'bg-green-100 text-green-800',
  venta_credito: 'bg-green-100 text-green-800',
  venta_plataforma: 'bg-blue-100 text-blue-800',
  cobranza: 'bg-green-100 text-green-800',
  deposito_plataforma: 'bg-blue-100 text-blue-800',

  // Egresos - Rojo/Naranja
  venta_tarjeta: 'bg-orange-100 text-orange-800',
  venta_transferencia: 'bg-orange-100 text-orange-800',
  retiro_parcial: 'bg-yellow-100 text-yellow-800',
  gasto: 'bg-red-100 text-red-800',
  compra: 'bg-red-100 text-red-800',
  prestamo: 'bg-purple-100 text-purple-800',
  cortesia: 'bg-pink-100 text-pink-800',
  otros_retiros: 'bg-gray-100 text-gray-800',
  pago_proveedor: 'bg-red-100 text-red-800',
  comision_plataforma: 'bg-orange-100 text-orange-800'
}

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<MovimientoData[]>([])
  const [empresas, setEmpresa] = useState<EmpresaData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('all')
  const [filtroIngreso, setFiltroIngreso] = useState<string>('all')
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('all')

  const cargarEmpresas = async () => {
    try {
      const response = await fetch('/api/empresas')
      if (!response.ok) throw new Error('Error al cargar empresas')
      const data = await response.json()
      setEmpresa(data.empresas || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar empresas')
    }
  }

  const cargarMovimientos = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroTipo !== 'all') params.set('tipo_movimiento', filtroTipo)
      if (filtroIngreso !== 'all') params.set('es_ingreso', filtroIngreso === 'ingreso' ? 'true' : 'false')
      if (filtroEmpresa !== 'all') params.set('empresa_id', filtroEmpresa)
      params.set('limit', '100') // Más movimientos para listado completo

      const response = await fetch(`/api/movimientos?${params}`)
      if (!response.ok) throw new Error('Error al cargar movimientos')

      const data = await response.json()
      setMovimientos(data.movimientos)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar movimientos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarEmpresas()
  }, [])

  useEffect(() => {
    cargarMovimientos()
  }, [filtroTipo, filtroIngreso, filtroEmpresa])

  useEffect(() => {
    cargarMovimientos()
  }, [])

  const movimientosFiltrados = movimientos.filter(movimiento => {
    const matchesSearch = search === '' ||
      movimiento.referencia?.toLowerCase().includes(search.toLowerCase()) ||
      movimiento.beneficiario?.toLowerCase().includes(search.toLowerCase()) ||
      movimiento.entidad_relacionada?.nombre.toLowerCase().includes(search.toLowerCase()) ||
      tipoMovimientoLabels[movimiento.tipo_movimiento]?.toLowerCase().includes(search.toLowerCase())

    return matchesSearch
  })

  const calcularTotales = () => {
    const ingresos = movimientosFiltrados
      .filter(m => m.es_ingreso)
      .reduce((sum, m) => sum + Number(m.monto), 0)

    const egresos = movimientosFiltrados
      .filter(m => !m.es_ingreso)
      .reduce((sum, m) => sum + Number(m.monto), 0)

    return { ingresos, egresos, neto: ingresos - egresos }
  }

  const totales = calcularTotales()

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/catalogos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Catálogos
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Movimientos Financieros</h1>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/movimientos/ingreso">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              INGRESO
            </Button>
          </Link>
          <Link href="/dashboard/movimientos/egreso">
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <TrendingDown className="h-4 w-4 mr-2" />
              EGRESO
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumen de Totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Ingresos</p>
                <p className="text-xl font-bold text-green-600">{formatearMonto(totales.ingresos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Egresos</p>
                <p className="text-xl font-bold text-red-600">{formatearMonto(totales.egresos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className={`h-5 w-5 ${totales.neto >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-sm text-gray-600">Flujo Neto</p>
                <p className={`text-xl font-bold ${totales.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatearMonto(totales.neto)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar movimientos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por Tipo */}
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(tipoMovimientoLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Ingreso/Egreso */}
            <Select value={filtroIngreso} onValueChange={setFiltroIngreso}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ingreso">Solo Ingresos</SelectItem>
                <SelectItem value="egreso">Solo Egresos</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por Empresa */}
            <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id.toString()}>
                    {empresa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Estadísticas */}
            <div className="flex items-center justify-end text-sm text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              {movimientosFiltrados.length} registros
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Movimientos */}
      {movimientosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || filtroTipo !== 'all' || filtroIngreso !== 'all' || filtroEmpresa !== 'all'
                ? 'No se encontraron movimientos'
                : 'No hay movimientos registrados'
              }
            </h3>
            <p className="text-gray-600 text-center">
              {search || filtroTipo !== 'all' || filtroIngreso !== 'all' || filtroEmpresa !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Usa los botones INGRESO o EGRESO arriba para registrar movimientos'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {movimientosFiltrados.map((movimiento) => (
            <Card key={movimiento.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Primera fila: Tipo y monto */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={tipoMovimientoColors[movimiento.tipo_movimiento]}>
                          {tipoMovimientoLabels[movimiento.tipo_movimiento]}
                        </Badge>
                        {movimiento.es_ingreso ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-bold ${
                          movimiento.es_ingreso ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movimiento.es_ingreso ? '+' : '-'}{formatearMonto(Number(movimiento.monto))}
                        </span>
                        <Link href={`/dashboard/movimientos/${movimiento.id}/editar`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Segunda fila: Detalles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatearFecha(movimiento.fecha)}
                      </div>

                      {movimiento.empresa && (
                        <div>
                          <span className="font-medium">Empresa:</span> {movimiento.empresa.nombre}
                        </div>
                      )}

                      {movimiento.entidad_relacionada && (
                        <div>
                          <span className="font-medium">
                            {movimiento.entidad_relacionada.es_cliente ? 'Cliente' :
                             movimiento.entidad_relacionada.es_proveedor ? 'Proveedor' : 'Entidad'}:
                          </span> {movimiento.entidad_relacionada.nombre}
                        </div>
                      )}

                      {movimiento.corte && (
                        <div>
                          <span className="font-medium">Corte:</span> #{movimiento.corte.id} S{movimiento.corte.sesion}
                        </div>
                      )}
                    </div>

                    {/* Tercera fila: Referencias y detalles adicionales */}
                    {(movimiento.referencia || movimiento.beneficiario || movimiento.forma_pago || movimiento.categoria) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {movimiento.referencia && (
                          <div>
                            <span className="font-medium text-gray-700">Ref:</span> {movimiento.referencia}
                          </div>
                        )}

                        {movimiento.beneficiario && (
                          <div>
                            <span className="font-medium text-gray-700">Beneficiario:</span> {movimiento.beneficiario}
                          </div>
                        )}

                        {movimiento.forma_pago && (
                          <div>
                            <span className="font-medium text-gray-700">Forma:</span>
                            <Badge variant="outline" className="ml-1 text-xs">
                              {movimiento.forma_pago}
                            </Badge>
                          </div>
                        )}

                        {movimiento.categoria && (
                          <div>
                            <span className="font-medium text-gray-700">Categoría:</span> {movimiento.categoria.nombre}
                            {movimiento.subcategoria && (
                              <span className="text-gray-500"> → {movimiento.subcategoria.nombre}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}