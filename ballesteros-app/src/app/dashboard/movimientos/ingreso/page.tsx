'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function NuevoIngresoPage() {
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

        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Registrar Ingreso</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Formulario de Ingresos
          </CardTitle>
          <CardDescription>
            Próximamente implementaremos el formulario dinámico para ingresos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              En desarrollo
            </h3>
            <p className="text-gray-600 mb-4">
              Por ahora, prueba el formulario de <strong>EGRESO</strong> con "Pago a Proveedores"
            </p>
            <Link href="/dashboard/movimientos/egreso">
              <Button className="bg-red-600 hover:bg-red-700">
                Ir a Egresos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}