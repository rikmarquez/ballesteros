'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, TrendingUp, DollarSign, Store, Building2, ChevronDown, Users } from 'lucide-react'
import ClienteSearch from '@/components/ui/cliente-search'
import { toast } from 'sonner'
import Link from 'next/link'

interface FormData {
  monto: string
  fecha: string
  cuenta_destino_id: string
  cliente_id: string
  referencia: string
}

interface CuentaData {
  id: number
  nombre: string
  tipo_cuenta: string
  empresa_asociada?: string
  saldo_actual: number
}

interface ClienteData {
  id: number
  nombre: string
  saldo_pendiente?: number
}

export default function CobranzaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [cuentas, setCuentas] = useState<CuentaData[]>([])
  const [clientes, setClientes] = useState<ClienteData[]>([])
  const [empresaActiva, setEmpresaActiva] = useState<number>(1)
  const [nombreEmpresa, setNombreEmpresa] = useState<string>('')
  const [empresasDisponibles, setEmpresasDisponibles] = useState<Array<{id: number, nombre: string}>>([])

  // Función helper para obtener fecha local en formato datetime-local
  const getFechaLocal = () => {
    const now = new Date()
    // Ajustar por zona horaria local
    const offset = now.getTimezoneOffset() * 60000
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16)
    return localISOTime
  }

  const [formData, setFormData] = useState<FormData>({
    monto: '',
    fecha: getFechaLocal(),
    cuenta_destino_id: '',
    cliente_id: '',
    referencia: ''
  })

  // Cargar empresa activa del localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmpresa = localStorage.getItem('empresaActiva')
      if (savedEmpresa) {
        setEmpresaActiva(parseInt(savedEmpresa))
      }
    }
  }, [])

  // Cargar empresas disponibles
  const cargarEmpresas = async () => {
    try {
      const response = await fetch('/api/empresas?activa=true')
      const data = await response.json()
      setEmpresasDisponibles(data.empresas || [])
    } catch (error) {
      console.error('Error cargando empresas:', error)
    }
  }

  // Cargar datos iniciales
  const cargarDatosIniciales = async () => {
    try {
      setLoadingData(true)

      // Cargar información de la empresa activa
      const empresaRes = await fetch(`/api/empresas/${empresaActiva}`)
      const empresaData = await empresaRes.json()
      setNombreEmpresa(empresaData.empresa?.nombre || 'Empresa')

      // Cargar TODAS las cuentas cajeras (sin filtrar por empresa)
      const cuentasRes = await fetch('/api/cuentas')
      const cuentasData = await cuentasRes.json()

      // Para COBRANZA: mostrar todas las cuentas cajeras disponibles
      const cuentasCajeras = cuentasData.cuentas?.filter((c: CuentaData) =>
        c.tipo_cuenta === 'cajera' && c.activa
      ) || []

      setCuentas(cuentasCajeras)

      // Cargar clientes
      const clientesRes = await fetch('/api/entidades?es_cliente=true')
      const clientesData = await clientesRes.json()
      setClientes(clientesData.entidades || [])

    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar los datos iniciales')
    } finally {
      setLoadingData(false)
    }
  }

  // Cargar empresas al montar
  useEffect(() => {
    cargarEmpresas()
  }, [])

  useEffect(() => {
    if (empresaActiva) {
      cargarDatosIniciales()
    }
  }, [empresaActiva])

  // Cambiar empresa activa
  const cambiarEmpresa = (nuevaEmpresaId: string) => {
    const id = parseInt(nuevaEmpresaId)
    setEmpresaActiva(id)
    localStorage.setItem('empresaActiva', id.toString())

    // Limpiar formulario cuando cambie la empresa
    setFormData(prev => ({
      ...prev,
      cuenta_destino_id: '',
      cliente_id: ''
    }))

    toast.success('Empresa activa cambiada')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.monto || !formData.cuenta_destino_id || !formData.cliente_id) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setLoading(true)

    try {
      // Crear fecha local para envío
      const fechaLocal = new Date(formData.fecha)

      const payload = {
        tipo_movimiento: 'cobranza',
        es_ingreso: true,
        es_traspaso: false,
        monto: parseFloat(formData.monto),
        fecha: fechaLocal.toISOString(),
        empresa_id: empresaActiva,
        cuenta_destino_id: parseInt(formData.cuenta_destino_id),
        entidad_relacionada_id: parseInt(formData.cliente_id),
        referencia: formData.referencia || `Cobranza - ${fechaLocal.toLocaleDateString('es-MX')}`
      }

      const response = await fetch('/api/movimientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const resultado = await response.json()
        toast.success(`Cobranza registrada por $${formData.monto}`)
        router.push('/dashboard/movimientos')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al registrar la cobranza')
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar la cobranza')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loadingData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando formulario...</p>
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

        <div className="flex items-center gap-4">
          {/* Título */}
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Cobranza</h1>
          </div>

          {/* Selector de Empresa Activa */}
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">Empresa:</span>
            <Select
              value={empresaActiva.toString()}
              onValueChange={cambiarEmpresa}
            >
              <SelectTrigger className="w-auto border-0 bg-transparent shadow-none p-0 h-auto font-medium text-blue-800">
                <SelectValue />
                <ChevronDown className="h-3 w-3 ml-1" />
              </SelectTrigger>
              <SelectContent>
                {empresasDisponibles.map(empresa => (
                  <SelectItem key={empresa.id} value={empresa.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {empresa.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Registrar Cobranza
          </CardTitle>
          <CardDescription>
            Cobrar dinero de clientes - afecta el estado de cuenta del cliente
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="monto">Importe *</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monto}
                  onChange={(e) => handleInputChange('monto', e.target.value)}
                  required
                  className="text-lg"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha y Hora *</Label>
                <Input
                  id="fecha"
                  type="datetime-local"
                  value={formData.fecha}
                  onChange={(e) => handleInputChange('fecha', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <ClienteSearch
                  clientes={clientes}
                  value={formData.cliente_id}
                  onValueChange={(value) => handleInputChange('cliente_id', value)}
                  placeholder="Buscar cliente por nombre..."
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cuenta_destino">Cuenta Cajera de Destino *</Label>
                <Select
                  value={formData.cuenta_destino_id}
                  onValueChange={(value) => handleInputChange('cuenta_destino_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona cualquier cajera" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentas.map(cuenta => (
                      <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                        <div className="flex justify-between items-center w-full">
                          <div className="flex flex-col">
                            <span className="font-medium">{cuenta.nombre}</span>
                            <span className="text-xs text-gray-500">
                              {cuenta.empresa_asociada || 'Todas las empresas'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            ${Number(cuenta.saldo_actual).toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="referencia">Referencia</Label>
                <Textarea
                  id="referencia"
                  placeholder="Ej: Factura 123, Pago parcial, etc."
                  value={formData.referencia}
                  onChange={(e) => handleInputChange('referencia', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/movimientos">
                  Cancelar
                </Link>
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Registrando...' : 'Registrar Cobranza'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}