'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, Plus, Search, Edit, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface CuentaData {
  id: number
  tipo_cuenta: string
  nombre: string
  saldo_actual: number
  activa: boolean
  created_at?: string
  _count?: {
    movimientos: number
    movimientos_origen: number
    movimientos_destino: number
  }
}

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState<CuentaData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('all')
  const [filtroActivo, setFiltroActivo] = useState<string>('all')

  const cargarCuentas = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroTipo !== 'all') params.set('tipo_cuenta', filtroTipo)
      if (filtroActivo !== 'all') params.set('activa', filtroActivo === 'activo' ? 'true' : 'false')

      const response = await fetch(`/api/cuentas?${params}`)
      if (!response.ok) throw new Error('Error al cargar cuentas')

      const data = await response.json()
      setCuentas(data.cuentas)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar cuentas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarCuentas()
  }, [filtroTipo, filtroActivo])

  const cuentasFiltradas = cuentas.filter(cuenta => {
    const matchesSearch = search === '' ||
      cuenta.nombre.toLowerCase().includes(search.toLowerCase()) ||
      cuenta.tipo_cuenta.toLowerCase().includes(search.toLowerCase())

    return matchesSearch
  })

  // Obtener tipos de cuenta únicos
  const tiposCuenta = [...new Set(cuentas.map(cuenta => cuenta.tipo_cuenta))].sort()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const getBadgeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'efectivo':
        return 'bg-green-100 text-green-800'
      case 'fiscal':
        return 'bg-blue-100 text-blue-800'
      case 'banco':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
          <DollarSign className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Cuentas del Sistema</h1>
        </div>

        <Link href="/dashboard/cuentas/nueva">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Cuenta
          </Button>
        </Link>
      </div>

      {/* Información importante */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Cuentas Transversales</h3>
              <p className="text-sm text-blue-800">
                Las cuentas son independientes de las empresas. Por ejemplo, los cortes de <strong>Principal</strong> y <strong>Express</strong>
                van a la misma <strong>"Caja Contadora Principal"</strong>. La contadora decide cómo mover el dinero entre cuentas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar cuentas..."
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
                {tiposCuenta.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Estado */}
            <Select value={filtroActivo} onValueChange={setFiltroActivo}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las cuentas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las cuentas</SelectItem>
                <SelectItem value="activo">Solo Activas</SelectItem>
                <SelectItem value="inactivo">Solo Inactivas</SelectItem>
              </SelectContent>
            </Select>

            {/* Estadísticas */}
            <div className="flex items-center justify-end text-sm text-gray-600">
              <DollarSign className="h-4 w-4 mr-2" />
              {cuentasFiltradas.length} cuentas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cuentas */}
      {cuentasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || filtroTipo !== 'all' || filtroActivo !== 'all'
                ? 'No se encontraron cuentas'
                : 'No hay cuentas registradas'
              }
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {search || filtroTipo !== 'all' || filtroActivo !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Las cuentas actuales ya están configuradas'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cuentasFiltradas.map((cuenta) => (
            <Card key={cuenta.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">{cuenta.nombre}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cuenta.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {cuenta.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <Link href={`/dashboard/cuentas/${cuenta.id}/editar`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Información básica */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getBadgeColor(cuenta.tipo_cuenta)}>
                      {cuenta.tipo_cuenta.charAt(0).toUpperCase() + cuenta.tipo_cuenta.slice(1)}
                    </Badge>
                    <p className="text-sm text-gray-600">ID: {cuenta.id}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 Cuenta transversal - recibe dinero de todas las empresas
                  </p>
                </div>

                {/* Saldo actual */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Saldo Actual</h4>
                  <p className={`text-lg font-bold ${cuenta.saldo_actual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(cuenta.saldo_actual)}
                  </p>
                </div>

                {/* Estadísticas */}
                {cuenta._count && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Movimientos</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{cuenta._count.movimientos_origen}</div>
                        <div className="text-gray-500">Como origen</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{cuenta._count.movimientos_destino}</div>
                        <div className="text-gray-500">Como destino</div>
                      </div>
                    </div>
                    <div className="text-center mt-2 pt-2 border-t">
                      <div className="font-semibold text-gray-700">{cuenta._count.movimientos}</div>
                      <div className="text-gray-500 text-xs">Total</div>
                    </div>
                  </div>
                )}

                {/* Fecha de creación */}
                {cuenta.created_at && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500">
                      Creada: {new Date(cuenta.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Información adicional */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              <strong>Tipos de Cuenta:</strong> EFECTIVO (caja registradora), FISCAL (cuenta bancaria principal), BANCO (otras cuentas).
            </p>
            <p>
              Las cuentas son <strong>transversales</strong> - no pertenecen a una empresa específica. La contadora decide cómo distribuir el dinero.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}