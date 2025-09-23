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
        body: JSON.stringify({
          ...corteData,
          venta_neta: Number(corteData.venta_neta || 0),
          venta_efectivo: Number(corteData.venta_efectivo || 0),
          venta_credito: Number(corteData.venta_credito || 0),
          venta_plataforma: Number(corteData.venta_plataforma || 0),
          cobranza: Number(corteData.cobranza || 0),
          venta_credito_tarjeta: Number(corteData.venta_credito_tarjeta || 0),
          venta_debito_tarjeta: Number(corteData.venta_debito_tarjeta || 0),
          venta_transferencia: Number(corteData.venta_transferencia || 0),
          retiro_parcial: Number(corteData.retiro_parcial || 0),
          gasto: Number(corteData.gasto || 0),
          compra: Number(corteData.compra || 0),
          prestamo: Number(corteData.prestamo || 0),
          cortesia: Number(corteData.cortesia || 0),
          otros_retiros: Number(corteData.otros_retiros || 0)
        })
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

      {/* NUEVO LAYOUT MEJORADO PARA UX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA 1: INFORMACIÓN GENERAL + VENTA NETA + EFECTIVO */}
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
            </CardContent>
          </Card>

          {/* Efectivo en Caja */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Efectivo en Caja
              </CardTitle>
              <CardDescription>Efectivo físico contado por la cajera</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="venta_efectivo">Efectivo Contado</Label>
                <Input
                  id="venta_efectivo"
                  type="number"
                  step="0.01"
                  value={corteData.venta_efectivo}
                  onChange={(e) => handleInputChange('venta_efectivo', parseFloat(e.target.value) || 0)}
                  className="text-lg font-medium"
                />
                <p className="text-xs text-blue-600 mt-1">💵 Total contado físicamente</p>
              </div>
            </CardContent>
          </Card>

          {/* Campos Calculados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                Campos Calculados
              </CardTitle>
              <CardDescription>Cálculos automáticos basados en los datos capturados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Venta en Efectivo Calculada */}
              <div className="p-3 bg-green-50 rounded-lg border">
                <h4 className="font-medium text-green-800 mb-2">Venta en Efectivo Calculada</h4>
                <p className="text-xl font-bold text-green-600">
                  ${camposCalculados.venta_efectivo_calculada.toFixed(2)}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Efectivo + Egresos - Cobranza
                </p>
              </div>

              {/* Total Venta sin Efectivo */}
              <div className="p-3 bg-blue-50 rounded-lg border">
                <h4 className="font-medium text-blue-800 mb-2">Total Venta sin Efectivo</h4>
                <p className="text-xl font-bold text-blue-600">
                  ${camposCalculados.total_ingresos.toFixed(2)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Crédito + Plataformas + Tarjetas + Transferencias + Cortesías
                </p>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* COLUMNA 2: TODOS LOS INGRESOS AGRUPADOS */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Ingresos
              </CardTitle>
              <CardDescription>Todas las formas de ingreso de la venta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Cobranza */}
              <div>
                <Label htmlFor="cobranza">Cobranza</Label>
                <Input
                  id="cobranza"
                  type="number"
                  step="0.01"
                  value={corteData.cobranza}
                  onChange={(e) => handleInputChange('cobranza', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-green-600 mt-1">✅ Aumenta efectivo físico</p>
              </div>

              {/* Venta a Crédito */}
              <div>
                <Label htmlFor="venta_credito">Venta a Crédito</Label>
                <Input
                  id="venta_credito"
                  type="number"
                  step="0.01"
                  value={corteData.venta_credito}
                  onChange={(e) => handleInputChange('venta_credito', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Sin efectivo físico</p>
              </div>

              {/* Venta Plataformas */}
              <div>
                <Label htmlFor="venta_plataforma">Venta Plataformas</Label>
                <Input
                  id="venta_plataforma"
                  type="number"
                  step="0.01"
                  value={corteData.venta_plataforma}
                  onChange={(e) => handleInputChange('venta_plataforma', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Uber Eats, Rappi, etc.</p>
              </div>

              {/* Tarjetas agrupadas pero compactas */}
              <div className="grid grid-cols-1 gap-3">
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
              </div>

              {/* Transferencias */}
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

              {/* Cortesías */}
              <div>
                <Label htmlFor="cortesia">Cortesías</Label>
                <Input
                  id="cortesia"
                  type="number"
                  step="0.01"
                  value={corteData.cortesia}
                  onChange={(e) => handleInputChange('cortesia', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Pagadas por la empresa</p>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* COLUMNA 3: EGRESOS */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Egresos
              </CardTitle>
              <CardDescription>Salidas que reducen efectivo físico de caja</CardDescription>
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

            </CardContent>
          </Card>

          {/* Total de Egresos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-red-600" />
                Total de Egresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-red-50 rounded-lg border">
                <p className="text-xl font-bold text-red-600">
                  ${Number(camposCalculados.total_egresos || 0).toFixed(2)}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Suma de todos los egresos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FRANJA DE TOTALES PRINCIPALES */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Venta Total Registrada */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Venta Total Registrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              ${camposCalculados.venta_total_registrada.toFixed(2)}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              Efectivo Calculada + Ventas sin Efectivo
            </p>
          </CardContent>
        </Card>

        {/* Ingreso Total Registrado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ingreso Total Registrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              ${camposCalculados.ingreso_total_registrado.toFixed(2)}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Total de ingresos registrados
            </p>
          </CardContent>
        </Card>

        {/* Efectivo Esperado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Efectivo Esperado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              ${camposCalculados.efectivo_esperado.toFixed(2)}
            </p>
            <p className="text-xs text-orange-700 mt-1">
              Efectivo que debería estar en caja
            </p>
          </CardContent>
        </Card>

        {/* Diferencia */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Diferencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${camposCalculados.diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${camposCalculados.diferencia.toFixed(2)}
            </p>
            <p className="text-xs text-gray-700 mt-1">
              Efectivo Real - Esperado
            </p>
          </CardContent>
        </Card>
      </div>


      {/* BOTÓN DE GUARDAR */}
      <div className="mt-8 flex justify-end">
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            'Crear Corte'
          )}
        </Button>
      </div>
    </div>
  )
}
