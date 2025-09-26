'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Users, Save, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NuevoClientePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [clienteData, setClienteData] = useState({
    nombre: '',
    telefono: '',
    saldo_inicial: '',
    activo: true
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setClienteData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clienteData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setIsSubmitting(true)
    try {
      const dataToSend = {
        nombre: clienteData.nombre.trim(),
        telefono: clienteData.telefono.trim() || null,
        saldo_inicial: clienteData.saldo_inicial ? parseFloat(clienteData.saldo_inicial) : 0,
        activo: clienteData.activo
      }

      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Cliente ${result.cliente.nombre} creado exitosamente`)
        router.push('/dashboard/clientes')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear cliente')
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
        <Link href="/dashboard/clientes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Cliente</h1>
            <p className="text-gray-600">Agregar cliente al sistema</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Cliente</CardTitle>
              <CardDescription>Datos básicos del cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  value={clienteData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Nombre completo del cliente"
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={clienteData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  placeholder="Número de teléfono"
                />
              </div>

              <div>
                <Label htmlFor="saldo_inicial">Saldo Inicial (Deuda)</Label>
                <Input
                  id="saldo_inicial"
                  type="number"
                  step="0.01"
                  min="0"
                  value={clienteData.saldo_inicial}
                  onChange={(e) => handleInputChange('saldo_inicial', e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-sm text-gray-600 mt-1">Cantidad que el cliente debe al momento de registrarlo</p>
              </div>

            </CardContent>
          </Card>

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración</CardTitle>
              <CardDescription>Estado y configuración del cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Estado Activo</Label>
                  <p className="text-sm text-gray-600">El cliente puede realizar transacciones</p>
                </div>
                <Switch
                  checked={clienteData.activo}
                  onCheckedChange={(checked) => handleInputChange('activo', checked)}
                />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href="/dashboard/clientes">
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
                Guardar Cliente
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}