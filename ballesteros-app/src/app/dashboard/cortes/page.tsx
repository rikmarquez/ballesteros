'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Edit, Eye, Calendar, Building, User } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Corte {
  id: number
  fecha: string
  sesion: number
  venta_neta: number
  efectivo_esperado: number
  efectivo_real: number
  diferencia: number
  adeudo_generado: boolean
  empresa: {
    id: number
    nombre: string
  }
  empleado: {
    id: number
    nombre: string
    puesto: string
  }
  created_at: string
}

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

export default function CortesPage() {
  const [cortes, setCortes] = useState<Corte[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    empresa_id: 'all',
    empleado_id: 'all',
    fecha: ''
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    cargarCortes()
  }, [filtros])

  const cargarDatos = async () => {
    try {
      // Cargar empresas
      const empresasRes = await fetch('/api/empresas')
      if (empresasRes.ok) {
        const empresasData = await empresasRes.json()
        setEmpresas(empresasData.empresas || [])
      }

      // Cargar empleados que pueden operar caja
      const empleadosRes = await fetch('/api/empleados?puede_operar_caja=true')
      if (empleadosRes.ok) {
        const empleadosData = await empleadosRes.json()
        setEmpleados(empleadosData.empleados || [])
      }

      await cargarCortes()
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const cargarCortes = async () => {
    try {
      const params = new URLSearchParams()
      if (filtros.empresa_id && filtros.empresa_id !== 'all') params.append('empresa_id', filtros.empresa_id)
      if (filtros.empleado_id && filtros.empleado_id !== 'all') params.append('empleado_id', filtros.empleado_id)
      if (filtros.fecha) params.append('fecha', filtros.fecha)

      const response = await fetch(`/api/cortes?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCortes(data.cortes || [])
      } else {
        throw new Error('Error al cargar cortes')
      }
    } catch (error) {
      console.error('Error cargando cortes:', error)
      toast.error('Error al cargar los cortes')
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto)
  }

  const getBadgeVariant = (diferencia: number) => {
    if (diferencia > 50) return 'default' // Sobrante
    if (diferencia < -50) return 'destructive' // Faltante
    return 'secondary' // Cuadrado
  }

  const getDiferenciaTexto = (diferencia: number) => {
    if (diferencia > 50) return 'Sobrante'
    if (diferencia < -50) return 'Faltante'
    return 'Cuadrado'
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Cargando cortes...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cortes de Caja</h1>
          <p className="text-muted-foreground">
            Gestiona y consulta los cortes de caja realizados
          </p>
        </div>
        <Link href="/dashboard/cortes/nuevo">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Corte
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtra los cortes por empresa, empleado o fecha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              <Select
                value={filtros.empresa_id}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, empresa_id: value }))}
              >
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
            </div>

            <div>
              <Label htmlFor="empleado">Empleado</Label>
              <Select
                value={filtros.empleado_id}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, empleado_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los empleados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los empleados</SelectItem>
                  {empleados.map((empleado) => (
                    <SelectItem key={empleado.id} value={empleado.id.toString()}>
                      {empleado.nombre} - {empleado.puesto}
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
                value={filtros.fecha}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Cortes */}
      <Card>
        <CardHeader>
          <CardTitle>Cortes Registrados</CardTitle>
          <CardDescription>
            {cortes.length} corte{cortes.length !== 1 ? 's' : ''} encontrado{cortes.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cortes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron cortes con los filtros aplicados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha/Sesión</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Venta Neta</TableHead>
                    <TableHead>Efectivo Esperado</TableHead>
                    <TableHead>Efectivo Real</TableHead>
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
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{formatearFecha(corte.fecha)}</div>
                            <div className="text-sm text-muted-foreground">
                              Sesión {corte.sesion} • {formatearHora(corte.created_at)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          {corte.empresa.nombre}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{corte.empleado.nombre}</div>
                            <div className="text-sm text-muted-foreground">{corte.empleado.puesto}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatearMoneda(corte.venta_neta)}
                      </TableCell>
                      <TableCell>
                        {formatearMoneda(corte.efectivo_esperado)}
                      </TableCell>
                      <TableCell>
                        {formatearMoneda(corte.efectivo_real)}
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${
                          corte.diferencia > 0 ? 'text-green-600' :
                          corte.diferencia < 0 ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {corte.diferencia > 0 ? '+' : ''}{formatearMoneda(corte.diferencia)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(corte.diferencia)}>
                          {getDiferenciaTexto(corte.diferencia)}
                        </Badge>
                        {corte.adeudo_generado && (
                          <Badge variant="destructive" className="ml-2">
                            Adeudo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/cortes/${corte.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/cortes/${corte.id}/editar`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}