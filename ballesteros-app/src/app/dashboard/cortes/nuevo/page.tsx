'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calculator, DollarSign, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { crearCorteSchema, CrearCorteData } from '@/lib/validations/cortes'

export default function NuevoCorteePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [efectivoEsperado, setEfectivoEsperado] = useState<number>(0)
  const [diferencia, setDiferencia] = useState<number>(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CrearCorteData>({
    resolver: zodResolver(crearCorteSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      sesion: 1,
    }
  })

  // Observar cambios en venta_neta y efectivo_real
  const watchVentaNeta = watch('venta_neta')
  const watchEfectivoReal = watch('efectivo_real')

  const calcularEfectivoEsperado = (ventaNeta: number) => {
    // Lógica básica: efectivo esperado = venta neta - ingresos no efectivo - egresos
    // TODO: Implementar cálculo completo basado en movimientos del turno
    const esperado = ventaNeta * 0.85 // Asumiendo 85% efectivo
    setEfectivoEsperado(esperado)
    return esperado
  }

  const calcularDiferencia = (esperado: number, real: number) => {
    const diff = real - esperado
    setDiferencia(diff)
    return diff
  }

  // Efecto para recalcular cuando cambian los valores
  useEffect(() => {
    if (watchVentaNeta) {
      const venta = parseFloat(watchVentaNeta.toString())
      if (!isNaN(venta)) {
        const esperado = calcularEfectivoEsperado(venta)
        if (watchEfectivoReal) {
          const real = parseFloat(watchEfectivoReal.toString())
          if (!isNaN(real)) {
            calcularDiferencia(esperado, real)
          }
        }
      }
    }
  }, [watchVentaNeta, watchEfectivoReal])

  const onSubmit = async (data: CrearCorteData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/cortes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const corte = await response.json()
        toast.success(`Corte #${corte.id} creado exitosamente`)
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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/cortes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Corte de Caja</h1>
          <p className="text-gray-600 mt-1">Registra el corte de caja del turno</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
              <CardDescription>Datos básicos del corte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="empresa">Empresa</Label>
                <Select onValueChange={(value) => setValue('empresa_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Principal</SelectItem>
                    <SelectItem value="2">Express</SelectItem>
                    <SelectItem value="3">Asadero</SelectItem>
                  </SelectContent>
                </Select>
                {errors.empresa_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.empresa_id.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="empleado">Cajera</Label>
                <Select onValueChange={(value) => setValue('empleado_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona cajera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">María González</SelectItem>
                    <SelectItem value="2">Ana López</SelectItem>
                    <SelectItem value="3">Carmen Rodríguez</SelectItem>
                  </SelectContent>
                </Select>
                {errors.empleado_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.empleado_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    {...register('fecha')}
                  />
                  {errors.fecha && (
                    <p className="text-sm text-red-600 mt-1">{errors.fecha.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="sesion">Sesión</Label>
                  <Input
                    id="sesion"
                    type="number"
                    min="1"
                    {...register('sesion', { valueAsNumber: true })}
                  />
                  {errors.sesion && (
                    <p className="text-sm text-red-600 mt-1">{errors.sesion.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Venta Neta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Venta Neta del POS
              </CardTitle>
              <CardDescription>Captura manual desde el sistema POS</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="venta_neta">Monto de Venta Neta</Label>
                <Input
                  id="venta_neta"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="text-lg"
                  {...register('venta_neta')}
                />
                {errors.venta_neta && (
                  <p className="text-sm text-red-600 mt-1">{errors.venta_neta.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Ingresa el total de ventas del día según el POS
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cálculos Automáticos */}
        {efectivoEsperado > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Cálculos Automáticos
              </CardTitle>
              <CardDescription>Basado en la venta neta y movimientos del turno</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Efectivo Esperado</p>
                  <p className="text-2xl font-bold text-blue-800">
                    ${efectivoEsperado.toFixed(2)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="efectivo_real">Efectivo Real Entregado</Label>
                  <Input
                    id="efectivo_real"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="text-lg"
                    {...register('efectivo_real')}
                  />
                  {errors.efectivo_real && (
                    <p className="text-sm text-red-600 mt-1">{errors.efectivo_real.message}</p>
                  )}
                </div>

                {watchEfectivoReal && (
                  <div className={`text-center p-4 rounded-lg ${
                    diferencia >= 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <p className={`text-sm font-medium ${
                      diferencia >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {diferencia >= 0 ? 'Sobrante' : 'Faltante'}
                    </p>
                    <p className={`text-2xl font-bold ${
                      diferencia >= 0 ? 'text-green-800' : 'text-red-800'
                    }`}>
                      ${Math.abs(diferencia).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags y Observaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tags y Observaciones</CardTitle>
            <CardDescription>Etiquetas para búsqueda y notas adicionales</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="tags">Tags (separados por comas)</Label>
              <Textarea
                id="tags"
                placeholder="Ej: turno-matutino, diferencia-menor, revision-pendiente"
                rows={3}
                {...register('tags')}
              />
              {errors.tags && (
                <p className="text-sm text-red-600 mt-1">{errors.tags.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex gap-4 justify-end">
          <Link href="/dashboard/cortes">
            <Button variant="outline" disabled={isSubmitting}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="px-8" disabled={isSubmitting}>
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
      </form>
    </div>
  )
}