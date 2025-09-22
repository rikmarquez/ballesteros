'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calculator, DollarSign, Loader2, TrendingUp, TrendingDown, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { calcularCamposCorte } from '@/lib/validations/cortes'

interface Empresa {
  id: number
  nombre: string
  activa: boolean
}

interface Entidad {
  id: number
  nombre: string
  puesto: string | null
  puede_operar_caja: boolean
  activo: boolean
  es_empleado: boolean
}

export default function NuevoCorteePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Datos de catálogos
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [entidades, setEntidades] = useState<Entidad[]>([])

  // Datos del corte (NUEVO FLUJO SIMPLIFICADO)
  const [corteData, setCorteData] = useState({
    empresa_id: '',
    entidad_id: '',
    fecha: new Date().toISOString().split('T')[0],
    sesion: 1,

    // CAPTURA MANUAL (desde POS)
    venta_neta: 0,

    // EFECTIVO REPORTADO POR CAJERA
    venta_efectivo: 0, // Efectivo físico contado en caja
    venta_credito: 0,
    venta_plataforma: 0,
    cobranza: 0,

    // EGRESOS (captura manual)
    venta_credito_tarjeta: 0,
    venta_debito_tarjeta: 0,
    venta_transferencia: 0,
    retiro_parcial: 0,
    gasto: 0,
    compra: 0,
    prestamo: 0,
    cortesia: 0,
    otros_retiros: 0
  })

  // Función para cargar datos de catálogos
  const cargarDatos = async () => {
    try {
      setLoadingData(true)

      const [empresasRes, entidadesRes] = await Promise.all([
        fetch('/api/empresas?activa=true'),
        fetch('/api/entidades?tipo=empleado&activo=true&puede_operar_caja=true')
      ])

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
      toast.error('Error al cargar datos de catálogos')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Cálculos automáticos
  const camposCalculados = calcularCamposCorte(corteData)

  const handleInputChange = (field: string, value: number) => {
    setCorteData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const onSubmit = async () => {
    if (!corteData.empresa_id || !corteData.entidad_id) {
      toast.error('Selecciona empresa y cajera')
      return
    }

    if (corteData.venta_neta === 0) {
      toast.error('Ingresa la venta neta del POS')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/cortes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corteData)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Corte #${result.corte.id} creado exitosamente`)
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
          <p className="text-gray-600 mt-1">Captura manual de totales - Flujo simplificado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Información General */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
              <CardDescription>Datos básicos del corte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="entidad">Cajera</Label>
                <Select
                  value={corteData.entidad_id}
                  onValueChange={(value) => setCorteData({...corteData, entidad_id: value})}
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Cargando..." : "Selecciona cajera"} />
                  </SelectTrigger>
                  <SelectContent>
                    {entidades.map((entidad) => (
                      <SelectItem key={entidad.id} value={entidad.id.toString()}>
                        {entidad.nombre} {entidad.puesto && `(${entidad.puesto})`}
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
            </CardContent>
          </Card>

          {/* Venta Neta del POS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Venta Neta del POS
              </CardTitle>
              <CardDescription>Total reportado por el sistema POS</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="venta_neta">Venta Neta Total</Label>
                <Input
                  id="venta_neta"
                  type="number"
                  step="0.01"
                  value={corteData.venta_neta}
                  onChange={(e) => handleInputChange('venta_neta', parseFloat(e.target.value) || 0)}
                  className="text-lg font-medium"
                />
              </div>

              {corteData.venta_neta > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">
                    ${corteData.venta_neta.toFixed(2)}
                  </p>
                  <p className="text-sm text-blue-700">Base para cálculos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna 2: Efectivo Reportado */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Efectivo Reportado por Cajera
              </CardTitle>
              <CardDescription>Efectivo físico contado en caja al final del turno</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="venta_efectivo">Efectivo en Caja</Label>
                <Input
                  id="venta_efectivo"
                  type="number"
                  step="0.01"
                  value={corteData.venta_efectivo}
                  onChange={(e) => handleInputChange('venta_efectivo', parseFloat(e.target.value) || 0)}
                  className="text-lg font-medium"
                />
                <p className="text-xs text-blue-600 mt-1">💵 Total contado físicamente por la cajera</p>
              </div>

              {corteData.venta_efectivo > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-600">
                    ${corteData.venta_efectivo.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-700">Efectivo reportado</p>
                </div>
              )}

              {/* Cálculo indirecto de venta en efectivo */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border">
                <h4 className="font-medium text-blue-800 mb-2">Venta en Efectivo (Calculada)</h4>
                <p className="text-lg font-bold text-blue-600">
                  ${camposCalculados.venta_efectivo_calculada.toFixed(2)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  = Efectivo en Caja + Egresos - Cobranza
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  = ${corteData.venta_efectivo.toFixed(2)} + ${camposCalculados.total_egresos.toFixed(2)} - ${corteData.cobranza.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Formas de Venta (sin efectivo)
              </CardTitle>
              <CardDescription>Ventas que NO generan efectivo físico en caja</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Separador visual para formas sin efectivo */}
              <div className="border-t pt-3">
                <h4 className="font-medium text-gray-700 mb-3">Formas sin efectivo físico</h4>
              </div>

              <div>
                <Label htmlFor="venta_credito">Venta a Crédito</Label>
                <Input
                  id="venta_credito"
                  type="number"
                  step="0.01"
                  value={corteData.venta_credito}
                  onChange={(e) => handleInputChange('venta_credito', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Ventas a crédito (sin efectivo)</p>
              </div>

              <div>
                <Label htmlFor="venta_plataforma">Venta Plataformas</Label>
                <Input
                  id="venta_plataforma"
                  type="number"
                  step="0.01"
                  value={corteData.venta_plataforma}
                  onChange={(e) => handleInputChange('venta_plataforma', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Uber Eats, Rappi, etc. (sin efectivo)</p>
              </div>

              {/* Tarjetas separadas */}
              <div className="space-y-3 p-3 border rounded-lg bg-blue-50">
                <h4 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Tarjetas (separadas)
                </h4>

                <div>
                  <Label htmlFor="venta_credito_tarjeta">Tarjetas de Crédito</Label>
                  <Input
                    id="venta_credito_tarjeta"
                    type="number"
                    step="0.01"
                    value={corteData.venta_credito_tarjeta}
                    onChange={(e) => handleInputChange('venta_credito_tarjeta', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Sin efectivo físico</p>
                </div>

                <div>
                  <Label htmlFor="venta_debito_tarjeta">Tarjetas de Débito</Label>
                  <Input
                    id="venta_debito_tarjeta"
                    type="number"
                    step="0.01"
                    value={corteData.venta_debito_tarjeta}
                    onChange={(e) => handleInputChange('venta_debito_tarjeta', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Sin efectivo físico</p>
                </div>

                <div className="text-sm text-blue-700 font-medium">
                  Total Tarjetas: ${camposCalculados.venta_tarjeta.toFixed(2)}
                </div>
              </div>

              <div>
                <Label htmlFor="venta_transferencia">Transferencias</Label>
                <Input
                  id="venta_transferencia"
                  type="number"
                  step="0.01"
                  value={corteData.venta_transferencia}
                  onChange={(e) => handleInputChange('venta_transferencia', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Sin efectivo físico</p>
              </div>

              <div>
                <Label htmlFor="cortesia">Cortesías</Label>
                <Input
                  id="cortesia"
                  type="number"
                  step="0.01"
                  value={corteData.cortesia}
                  onChange={(e) => handleInputChange('cortesia', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Pagadas por la empresa (sin efectivo)</p>
              </div>

              <div>
                <Label htmlFor="cobranza">Cobranza</Label>
                <Input
                  id="cobranza"
                  type="number"
                  step="0.01"
                  value={corteData.cobranza}
                  onChange={(e) => handleInputChange('cobranza', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-green-600 mt-1">✅ Aumenta efectivo físico esperado</p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800">
                  Total Ventas sin Efectivo: ${camposCalculados.total_ingresos.toFixed(2)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Estas ventas no aumentan el efectivo físico de caja
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna 3: Egresos Reales */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Egresos Reales
              </CardTitle>
              <CardDescription>Salidas que REDUCEN efectivo físico de caja</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="retiro_parcial">Retiros Parciales</Label>
                <Input
                  id="retiro_parcial"
                  type="number"
                  step="0.01"
                  value={corteData.retiro_parcial}
                  onChange={(e) => handleInputChange('retiro_parcial', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-red-600 mt-1">❌ Reduce efectivo físico</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="gasto">Gastos</Label>
                  <Input
                    id="gasto"
                    type="number"
                    step="0.01"
                    value={corteData.gasto}
                    onChange={(e) => handleInputChange('gasto', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-red-600 mt-1">❌ Reduce efectivo físico</p>
                </div>

                <div>
                  <Label htmlFor="compra">Compras</Label>
                  <Input
                    id="compra"
                    type="number"
                    step="0.01"
                    value={corteData.compra}
                    onChange={(e) => handleInputChange('compra', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-red-600 mt-1">❌ Reduce efectivo físico</p>
                </div>

                <div>
                  <Label htmlFor="prestamo">Préstamos</Label>
                  <Input
                    id="prestamo"
                    type="number"
                    step="0.01"
                    value={corteData.prestamo}
                    onChange={(e) => handleInputChange('prestamo', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-red-600 mt-1">❌ Reduce efectivo físico</p>
                </div>
              </div>

              <div>
                <Label htmlFor="otros_retiros">Otros Retiros</Label>
                <Input
                  id="otros_retiros"
                  type="number"
                  step="0.01"
                  value={corteData.otros_retiros}
                  onChange={(e) => handleInputChange('otros_retiros', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-red-600 mt-1">❌ Reduce efectivo físico</p>
              </div>

              <div className="p-3 bg-red-50 rounded-lg">
                <p className="font-medium text-red-800">
                  Total Egresos Reales: ${camposCalculados.total_egresos.toFixed(2)}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Solo gastos que retiran efectivo de caja
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Panel de Información y Validación */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Información y Validación del Corte
          </CardTitle>
          <CardDescription>Métricas clave para validar la consistencia de los datos capturados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

            {/* Columna 1: Ventas e Ingresos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Ventas e Ingresos</h3>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Venta Total Registrada</h4>
                <p className="text-2xl font-bold text-blue-600">
                  ${corteData.venta_neta.toFixed(2)}
                </p>
                <p className="text-sm text-blue-700">Desde el POS</p>
              </div>

              <div className="p-4 bg-teal-50 rounded-lg">
                <h4 className="font-medium text-teal-800">Ingreso Total Registrado</h4>
                <p className="text-2xl font-bold text-teal-600">
                  ${camposCalculados.ingreso_total_registrado.toFixed(2)}
                </p>
                <p className="text-sm text-teal-700">Efectivo calculado + Ventas sin efectivo + Cobranza</p>
              </div>
            </div>

            {/* Columna 2: Egresos y Efectivo */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Egresos y Efectivo</h3>

              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800">Egresos Reales</h4>
                <p className="text-2xl font-bold text-red-600">
                  ${camposCalculados.total_egresos.toFixed(2)}
                </p>
                <p className="text-sm text-red-700">Gastos que reducen efectivo de caja</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800">Efectivo en Caja</h4>
                <p className="text-2xl font-bold text-purple-600">
                  ${corteData.venta_efectivo.toFixed(2)}
                </p>
                <p className="text-sm text-purple-700">Reportado por cajera</p>
              </div>
            </div>

            {/* Columna 3: Validación */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Validación</h3>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800">Efectivo Esperado</h4>
                <p className="text-2xl font-bold text-gray-600">
                  ${camposCalculados.efectivo_esperado.toFixed(2)}
                </p>
                <p className="text-sm text-gray-700">Según cálculos del sistema</p>
              </div>

              <div className={`p-4 rounded-lg ${
                camposCalculados.diferencia >= 0 ? 'bg-green-50' : 'bg-amber-50'
              }`}>
                <h4 className={`font-medium ${
                  camposCalculados.diferencia >= 0 ? 'text-green-800' : 'text-amber-800'
                }`}>
                  Diferencia
                </h4>
                <p className={`text-2xl font-bold ${
                  camposCalculados.diferencia >= 0 ? 'text-green-600' : 'text-amber-600'
                }`}>
                  ${camposCalculados.diferencia.toFixed(2)}
                </p>
                <p className={`text-sm ${
                  camposCalculados.diferencia >= 0 ? 'text-green-700' : 'text-amber-700'
                }`}>
                  {camposCalculados.diferencia >= 0 ? 'Sobrante' : 'Faltante'}
                </p>
              </div>
            </div>
          </div>

          {/* Fórmulas de referencia */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
            <h4 className="font-medium text-slate-800 mb-2">Fórmulas de Cálculo:</h4>
            <div className="text-sm text-slate-600 space-y-1">
              <p><strong>Efectivo Esperado:</strong> Venta Neta - (Ventas sin efectivo) - (Egresos reales) + Cobranza</p>
              <p><strong>Diferencia:</strong> Efectivo en Caja - Efectivo Esperado</p>
              <p><strong>Ingreso Total:</strong> Venta en Efectivo + Ventas sin Efectivo + Cobranza</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={onSubmit}
                disabled={isSubmitting || !corteData.empresa_id || !corteData.entidad_id || corteData.venta_neta === 0}
                className="px-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Corte'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}