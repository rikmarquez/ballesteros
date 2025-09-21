'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="container mx-auto py-8">
      {/* Header centrado */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Sistema Financiero Ballesteros
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Control financiero para Carnicería Principal, Express y Asadero
        </p>
        {session && (
          <p className="text-sm text-green-600">
            Bienvenido: {session.user.name} ({session.user.puesto})
          </p>
        )}
      </div>

      {/* Botón de cerrar sesión alineado con los módulos */}
      {session && (
        <div className="max-w-4xl mx-auto mb-6 flex justify-end">
          <Button
            variant="outline"
            onClick={() => signOut()}
          >
            Cerrar Sesión
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Cortes de Caja</CardTitle>
            <CardDescription>
              Registro y control de cortes de caja por cajera y sesión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/cortes">
              <Button className="w-full">Ir a Cortes</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimientos</CardTitle>
            <CardDescription>
              Ingresos y egresos fuera de cortes de caja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/movimientos">
              <Button className="w-full">Ir a Movimientos</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reportes</CardTitle>
            <CardDescription>
              Consultas y reportes por empresa y consolidados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/reportes">
              <Button className="w-full">Ver Reportes</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catálogos</CardTitle>
            <CardDescription>
              Empleados, clientes, proveedores y categorías
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/catalogos">
              <Button className="w-full">Gestionar Catálogos</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado Actual</CardTitle>
            <CardDescription>
              Base de datos configurada ✅<br/>
              Esquema Prisma desplegado ✅<br/>
              Componentes UI listos ✅
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('/docs/project-status.md', '_blank')}
            >
              Ver Documentación
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center text-sm text-gray-500">
        <p>Versión MVP en desarrollo | Railway PostgreSQL conectado</p>
        <p>Next.js 14 + TypeScript + Prisma + shadcn/ui</p>
      </div>
    </div>
  )
}
