'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calculator, DollarSign, Loader2, TrendingUp, TrendingDown, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { calcularCamposCorte } from '@/lib/validations/cortes'

interface CorteData {
  id: number
  empresa_id: number
  entidad_id: number
  fecha: string
  sesion: number

  // CAPTURA MANUAL (desde POS)
  venta_neta: number

  // EFECTIVO REPORTADO POR CAJERA
  venta_efectivo: number
  venta_credito: number
  venta_plataforma: number
  cobranza: number

  // EGRESOS (captura manual)
  venta_credito_tarjeta: number
  venta_debito_tarjeta: number
  venta_transferencia: number
  retiro_parcial: number
  gasto: number
  compra: number
  prestamo: number
  cortesia: number
  otros_retiros: number

  // CÁLCULOS AUTOMÁTICOS
  venta_tarjeta: number
  total_ingresos: number
  total_egresos: number
  efectivo_esperado: number
  diferencia: number
  adeudo_generado: boolean

  estado: 'activo' | 'cerrado' | 'eliminado'
  created_at: string

  // Relaciones
  empresa: {
    id: number
    nombre: string
  }
  empleado: {
    id: number
    nombre: string
    puesto?: string
  }
}

export default function EditarCortePage() {
  const params = useParams()
  const router = useRouter()
  const corteId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [corteData, setCorteData] = useState<CorteData | null>(null)

  // Función para cargar el corte
  const cargarCorte = async () => {
    try {
      setLoadingData(true)

      const response = await fetch(`/api/cortes/${corteId}`)

      if (!response.ok) {
        throw new Error('Error al cargar el corte')
      }

      const data = await response.json()
      setCorteData(data.corte)

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar el corte')
      router.push('/dashboard/cortes')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    cargarCorte()
  }, [corteId])

  // Cálculos automáticos usando los datos actuales
  const camposCalculados = corteData ? calcularCamposCorte(corteData) : {
    venta_tarjeta: 0,
    total_ingresos: 0,
    total_egresos: 0,
    efectivo_esperado: 0,
    diferencia: 0,
    venta_efectivo_calculada: 0,
    ingreso_total_registrado: 0,
    adeudo_generado: false
  }

  const handleInputChange = (field: string, value: number) => {
    if (!corteData) return

    setCorteData(prev => ({
      ...prev!,
      [field]: value
    }))
  }

  const onSubmit = async () => {
    if (!corteData) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/cortes/${corteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        toast.success(`Corte #${result.corte.id} actualizado exitosamente`)
        router.push('/dashboard/cortes')
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al actualizar corte")
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error("No se pudo conectar con el servidor")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Cargando corte...</div>
        </div>
      </div>
    )
  }

  if (!corteData) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Corte no encontrado</p>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-gray-900">Editar Corte #{corteData.id}</h1>
          <p className="text-gray-600 mt-1">
            {corteData.empresa.nombre} • {corteData.empleado.nombre} • {new Date(corteData.fecha).toLocaleDateString('es-MX')}
          </p>
        </div>
      </div>

      {/* NUEVO LAYOUT MEJORADO PARA UX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA 1: VENTA NETA (POS) + EFECTIVO REPORTADO */}
        <div className="space-y-6">
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
                  value={Number(corteData.venta_neta || 0)}
                  onChange={(e) => handleInputChange('venta_neta', parseFloat(e.target.value) || 0)}
                  className="text-lg font-medium"
                />
              </div>
            </CardContent>
          </Card>

          {/* Efectivo Reportado por Cajera */}
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
                  value={Number(corteData.venta_efectivo || 0)}
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
                  ${Number(camposCalculados.venta_efectivo_calculada || 0).toFixed(2)}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Efectivo + Egresos - Cobranza
                </p>
              </div>

              {/* Total Venta sin Efectivo */}
              <div className="p-3 bg-blue-50 rounded-lg border">
                <h4 className="font-medium text-blue-800 mb-2">Total Venta sin Efectivo</h4>
                <p className="text-xl font-bold text-blue-600">
                  ${Number(camposCalculados.total_ingresos || 0).toFixed(2)}
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
                  value={Number(corteData.cobranza || 0)}
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
                  value={Number(corteData.venta_credito || 0)}
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
                  value={Number(corteData.venta_plataforma || 0)}
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
                    value={Number(corteData.venta_credito_tarjeta || 0)}
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
                    value={Number(corteData.venta_debito_tarjeta || 0)}
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
                  value={Number(corteData.venta_transferencia || 0)}
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
                  value={Number(corteData.cortesia || 0)}
                  onChange={(e) => handleInputChange('cortesia', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Pagadas por la empresa</p>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* COLUMNA 3: EGRESOS (IGUAL QUE ANTES) */}
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
                  value={Number(corteData.retiro_parcial || 0)}
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
                    value={Number(corteData.gasto || 0)}
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
                    value={Number(corteData.compra || 0)}
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
                    value={Number(corteData.prestamo || 0)}
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
                  value={Number(corteData.otros_retiros || 0)}
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
              ${Number(camposCalculados.venta_total_registrada || 0).toFixed(2)}
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
              ${Number(camposCalculados.ingreso_total_registrado || 0).toFixed(2)}
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
              ${Number(camposCalculados.efectivo_esperado || 0).toFixed(2)}
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
            <p className={`text-2xl font-bold ${Number(camposCalculados.diferencia || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Number(camposCalculados.diferencia || 0).toFixed(2)}
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
              Guardando...
            </>
          ) : (
            'Guardar Cambios'
          )}
        </Button>
      </div>
    </div>
  )
}
