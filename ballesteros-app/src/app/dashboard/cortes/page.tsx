'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building,
  User,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Calculator
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Empresa {
  id: number
  nombre: string
}

interface Entidad {
  id: number
  nombre: string
  puesto: string | null
}

interface Corte {
  id: number
  empresa_id: number
  entidad_id: number
  fecha: string
  sesion: number

  // Captura manual
  venta_neta: number
  venta_efectivo: number
  venta_credito: number
  venta_plataforma: number
  cobranza: number

  // Egresos
  venta_credito_tarjeta: number
  venta_debito_tarjeta: number
  venta_tarjeta: number
  venta_transferencia: number
  retiro_parcial: number
  gasto: number
  compra: number
  prestamo: number
  cortesia: number
  otros_retiros: number

  // Cálculos automáticos
  total_ingresos: number
  total_egresos: number
  efectivo_esperado: number
  diferencia: number
  adeudo_generado: boolean

  estado: 'activo' | 'cerrado' | 'eliminado'
  created_at: string

  // Relaciones
  empresa: Empresa
  empleado: Entidad
}

interface CortesPaginados {
  cortes: Corte[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export default function CortesPage() {
  const [cortes, setCortes] = useState<Corte[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [entidades, setEntidades] = useState<Entidad[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  })

  // Filtros
  const [filtros, setFiltros] = useState({
    empresa_id: 'all',
    entidad_id: 'all',
    fecha: '',
    estado: 'all'
  })

  // Cargar datos iniciales
  const cargarDatos = async () => {
    try {
      setLoading(true)

      const [cortesRes, empresasRes, entidadesRes] = await Promise.all([
        fetch(`/api/cortes?${new URLSearchParams({
          empresa_id: filtros.empresa_id,
          entidad_id: filtros.entidad_id,
          fecha: filtros.fecha,
          estado: filtros.estado,
          limit: pagination.limit.toString(),
          offset: '0'
        })}`),
        fetch('/api/empresas?activa=true'),
        fetch('/api/entidades?tipo=empleado&activo=true')
      ])

      if (cortesRes.ok) {
        const data: CortesPaginados = await cortesRes.json()
        setCortes(data.cortes)
        setPagination(data.pagination)
      }

      if (empresasRes.ok) {
        const data = await empresasRes.json()
        setEmpresas(data.empresas)
      }

      if (entidadesRes.ok) {
        const data = await entidadesRes.json()
        setEntidades(data.entidades)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Cargar más cortes (paginación)
  const cargarMas = async () => {
    if (loadingMore || !pagination.hasMore) return

    try {
      setLoadingMore(true)

      const response = await fetch(`/api/cortes?${new URLSearchParams({
        empresa_id: filtros.empresa_id,
        entidad_id: filtros.entidad_id,
        fecha: filtros.fecha,
        estado: filtros.estado,
        limit: pagination.limit.toString(),
        offset: (pagination.offset + pagination.limit).toString()
      })}`)

      if (response.ok) {
        const data: CortesPaginados = await response.json()
        setCortes(prev => [...prev, ...data.cortes])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error cargando más cortes:', error)
      toast.error('Error al cargar más cortes')
    } finally {
      setLoadingMore(false)
    }
  }

  // Aplicar filtros
  const aplicarFiltros = () => {
    setPagination(prev => ({ ...prev, offset: 0 }))
    cargarDatos()
  }

  // Eliminar corte
  const eliminarCorte = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este corte?')) return

    try {
      const response = await fetch(`/api/cortes/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Corte eliminado exitosamente')
        cargarDatos() // Recargar lista
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar corte')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar corte')
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>
      case 'cerrado':
        return <Badge className="bg-blue-100 text-blue-800">Cerrado</Badge>
      case 'eliminado':
        return <Badge className="bg-red-100 text-red-800">Eliminado</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{estado}</Badge>
    }
  }

  const getBadgeDiferencia = (diferencia: number, adeudoGenerado: boolean) => {
    if (adeudoGenerado) {
      return (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Adeudo: ${Math.abs(diferencia).toFixed(2)}
        </Badge>
      )
    } else if (diferencia > 0) {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          +${diferencia.toFixed(2)}
        </Badge>
      )
    } else if (diferencia < 0) {
      return (
        <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
          <TrendingDown className="h-3 w-3" />
          ${diferencia.toFixed(2)}
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Exacto
        </Badge>
      )
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between flex-1">
          <div className="flex items-center gap-3">
            <Calculator className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cortes de Caja</h1>
              <p className="text-gray-600">Nuevo flujo simplificado - Solo totales</p>
            </div>
          </div>
          <Link href="/dashboard/cortes/nuevo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Corte
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="filtro-empresa">Empresa</Label>
              <Select
                value={filtros.empresa_id}
                onValueChange={(value) => setFiltros({...filtros, empresa_id: value})}
              >
                <SelectTrigger>
                  <SelectValue />
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
            </div>

            <div>
              <Label htmlFor="filtro-entidad">Cajera</Label>
              <Select
                value={filtros.entidad_id}
                onValueChange={(value) => setFiltros({...filtros, entidad_id: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las cajeras</SelectItem>
                  {entidades.map((entidad) => (
                    <SelectItem key={entidad.id} value={entidad.id.toString()}>
                      {entidad.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filtro-fecha">Fecha</Label>
              <Input
                id="filtro-fecha"
                type="date"
                value={filtros.fecha}
                onChange={(e) => setFiltros({...filtros, fecha: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="filtro-estado">Estado</Label>
              <Select
                value={filtros.estado}
                onValueChange={(value) => setFiltros({...filtros, estado: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                  <SelectItem value="eliminado">Eliminado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={aplicarFiltros} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      {cortes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Cortes</p>
                  <p className="text-2xl font-bold">{pagination.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Venta Total</p>
                  <p className="text-2xl font-bold">
                    ${cortes.reduce((sum, c) => sum + Number(c.venta_neta || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Con Adeudo</p>
                  <p className="text-2xl font-bold">
                    {cortes.filter(c => c.adeudo_generado).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sin Diferencia</p>
                  <p className="text-2xl font-bold">
                    {cortes.filter(c => c.diferencia === 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de cortes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cortes</CardTitle>
          <CardDescription>
            Cortes ordenados por fecha (más recientes primero)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando cortes...</p>
            </div>
          ) : cortes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron cortes</p>
              <Link href="/dashboard/cortes/nuevo">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Corte
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Cajera</TableHead>
                    <TableHead>Venta Neta</TableHead>
                    <TableHead>Efectivo Esp.</TableHead>
                    <TableHead>Diferencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cortes.map((corte) => (
                    <TableRow key={corte.id}>
                      <TableCell className="font-medium">#{corte.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          {new Date(corte.fecha).toLocaleDateString()}
                          {corte.sesion > 1 && (
                            <Badge variant="outline" className="text-xs">
                              S{corte.sesion}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          {corte.empresa.nombre}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          {corte.empleado.nombre}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${Number(corte.venta_neta || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${Number(corte.efectivo_esperado || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getBadgeDiferencia(corte.diferencia, corte.adeudo_generado)}
                      </TableCell>
                      <TableCell>
                        {getBadgeEstado(corte.estado)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/dashboard/cortes/${corte.id}`}>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/dashboard/cortes/${corte.id}/editar`}>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => eliminarCorte(corte.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {pagination.hasMore && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={cargarMas}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Cargando...' : 'Cargar Más'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}