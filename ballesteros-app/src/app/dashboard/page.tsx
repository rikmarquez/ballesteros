'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Calculator,
  Database,
  TrendingUp,
  Users,
  DollarSign,
  Building2,
  ShoppingCart,
  UserCheck,
  Truck
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-6">

      {/* Botones de acción rápida */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/movimientos/ingreso">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                <TrendingUp className="h-5 w-5" />
                Nuevo Ingreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-600">Registrar ventas y cobranzas</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/movimientos/egreso">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                <TrendingUp className="h-5 w-5 rotate-180" />
                Nuevo Egreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">Registrar pagos y gastos</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/movimientos">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                <BarChart3 className="h-5 w-5" />
                Ver Movimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-600">Consultar historial financiero</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/cortes">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                <Calculator className="h-5 w-5" />
                Cortes de Caja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-600">Gestionar cortes diarios</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Gestión de entidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Catálogos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-600" />
              Gestión de Entidades
            </CardTitle>
            <CardDescription>
              Administrar empleados, clientes y proveedores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/empleados">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Users className="h-4 w-4 text-blue-600" />
                Empleados
              </Button>
            </Link>
            <Link href="/dashboard/clientes">
              <Button variant="outline" className="w-full justify-start gap-3">
                <UserCheck className="h-4 w-4 text-green-600" />
                Clientes
              </Button>
            </Link>
            <Link href="/dashboard/proveedores">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Truck className="h-4 w-4 text-orange-600" />
                Proveedores
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-600" />
              Configuración del Sistema
            </CardTitle>
            <CardDescription>
              Gestionar catálogos y configuraciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/empresas">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Building2 className="h-4 w-4 text-purple-600" />
                Empresas
              </Button>
            </Link>
            <Link href="/dashboard/cuentas">
              <Button variant="outline" className="w-full justify-start gap-3">
                <DollarSign className="h-4 w-4 text-yellow-600" />
                Cuentas
              </Button>
            </Link>
            <Link href="/dashboard/categorias">
              <Button variant="outline" className="w-full justify-start gap-3">
                <ShoppingCart className="h-4 w-4 text-indigo-600" />
                Categorías y Subcategorías
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Bienvenido al Sistema Financiero Ballesteros</CardTitle>
          <CardDescription>
            Sistema integrado para el control financiero de Carnicería Principal, Express y Asadero
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">100%</div>
              <div className="text-sm text-green-600">Sistema Operativo</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">3</div>
              <div className="text-sm text-blue-600">Empresas Activas</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">Multi</div>
              <div className="text-sm text-purple-600">Empresa</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}