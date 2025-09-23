'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Truck,
  ShoppingCart,
  FolderOpen,
  Tags,
  ArrowLeft,
  Database,
  Building2
} from 'lucide-react'
import Link from 'next/link'

interface CatalogoItem {
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  bgColor: string
  available: boolean
}

const catalogos: CatalogoItem[] = [
  {
    title: 'Empleados',
    description: 'Gestión de empleados y personal del grupo',
    icon: Users,
    href: '/dashboard/empleados',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    available: true
  },
  {
    title: 'Proveedores',
    description: 'Gestión de proveedores y suministros',
    icon: Truck,
    href: '/dashboard/proveedores',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    available: true
  },
  {
    title: 'Clientes',
    description: 'Gestión de clientes y relaciones comerciales',
    icon: ShoppingCart,
    href: '/dashboard/clientes',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    available: true
  },
  {
    title: 'Categorías de Gasto',
    description: 'Categorías principales para clasificación de gastos',
    icon: FolderOpen,
    href: '/dashboard/categorias',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    available: true
  },
  {
    title: 'Subcategorías de Gasto',
    description: 'Subcategorías específicas dentro de cada categoría',
    icon: Tags,
    href: '/dashboard/subcategorias',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    available: false
  },
  {
    title: 'Empresas',
    description: 'Configuración de empresas y sucursales',
    icon: Building2,
    href: '/dashboard/empresas',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    available: false
  }
]

export default function CatalogosPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-slate-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catálogos del Sistema</h1>
            <p className="text-gray-600">Gestión centralizada de entidades y configuraciones</p>
          </div>
        </div>
      </div>


      {/* Grid de catálogos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {catalogos.map((catalogo) => {
          const IconComponent = catalogo.icon

          return (
            <Card
              key={catalogo.href}
              className={`hover:shadow-lg transition-all duration-200 ${
                catalogo.available
                  ? 'hover:scale-105 cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${catalogo.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${catalogo.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {catalogo.title}
                      {!catalogo.available && (
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                          Próximamente
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {catalogo.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {catalogo.available ? (
                  <Link href={catalogo.href}>
                    <Button className="w-full gap-2" variant="outline">
                      <IconComponent className="h-4 w-4" />
                      Gestionar {catalogo.title}
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full gap-2" variant="outline" disabled>
                    <IconComponent className="h-4 w-4" />
                    Próximamente
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Estadísticas rápidas */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Resumen del Sistema</CardTitle>
          <CardDescription>Vista general de las entidades registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600 mb-1">4</div>
              <div className="text-sm text-gray-600">Módulos Activos</div>
              <div className="text-xs text-gray-500 mt-1">Empleados, Proveedores, Clientes, Categorías</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-green-600 mb-1">3</div>
              <div className="text-sm text-gray-600">Empresas del Grupo</div>
              <div className="text-xs text-gray-500 mt-1">Principal, Express, Asadero</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-purple-600 mb-1">2</div>
              <div className="text-sm text-gray-600">Módulos Planeados</div>
              <div className="text-xs text-gray-500 mt-1">Subcategorías, Empresas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ayuda y documentación */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              💡 <strong>Consejo:</strong> Todos los empleados, proveedores y clientes tienen acceso automático
              a todas las empresas del grupo para máxima flexibilidad operativa.
            </p>
            <p>
              Si necesitas ayuda con algún módulo, revisa la documentación o contacta al administrador del sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}