'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2, Users, Save } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NuevoEmpleadoPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Datos del empleado
  const [empleadoData, setEmpleadoData] = useState({
    nombre: '',
    telefono: '',
    puesto: '',
    puede_operar_caja: false,
    activo: true
  })

  // Los empleados se asignan automáticamente a todas las empresas

  const handleInputChange = (field: string, value: string | boolean) => {
    setEmpleadoData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Función removida - empleados pertenecen a todas las empresas automáticamente

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones básicas
    if (!empleadoData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    // Los empleados automáticamente pertenecen a todas las empresas

    setIsSubmitting(true)
    try {
      // Preparar datos para enviar al API - formato transparente
      const dataToSend = {
        nombre: empleadoData.nombre.trim(),
        telefono: empleadoData.telefono.trim() || null,
        puesto: empleadoData.puesto.trim() || null,
        puede_operar_caja: empleadoData.puede_operar_caja,
        activo: empleadoData.activo
        // No enviamos empresas - el backend automáticamente asigna a todas
      }

      const response = await fetch('/api/empleados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Empleado ${result.empleado.nombre} creado exitosamente`)
        router.push('/dashboard/empleados')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear empleado')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al conectar con el servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/empleados">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Empleado</h1>
            <p className="text-gray-600">Agregar empleado al sistema</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Personal</CardTitle>
              <CardDescription>Datos básicos del empleado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  value={empleadoData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Nombre completo del empleado"
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={empleadoData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  placeholder="Número de teléfono"
                />
              </div>

              <div>
                <Label htmlFor="puesto">Puesto</Label>
                <Input
                  id="puesto"
                  value={empleadoData.puesto}
                  onChange={(e) => handleInputChange('puesto', e.target.value)}
                  placeholder="Puesto o cargo del empleado"
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuración y Permisos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración</CardTitle>
              <CardDescription>Permisos y configuración del empleado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Puede Operar Caja</Label>
                  <p className="text-sm text-gray-600">Permitir realizar cortes de caja</p>
                </div>
                <Switch
                  checked={empleadoData.puede_operar_caja}
                  onCheckedChange={(checked) => handleInputChange('puede_operar_caja', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Estado Activo</Label>
                  <p className="text-sm text-gray-600">El empleado puede usar el sistema</p>
                </div>
                <Switch
                  checked={empleadoData.activo}
                  onCheckedChange={(checked) => handleInputChange('activo', checked)}
                />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href="/dashboard/empleados">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Empleado
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}