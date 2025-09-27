'use client'

import { usePathname } from 'next/navigation'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Función para determinar el título basado en la ruta
  const getPageInfo = () => {
    if (pathname === '/dashboard') {
      return { title: 'Dashboard Principal', subtitle: 'Panel de control del sistema financiero' }
    }

    if (pathname.startsWith('/dashboard/movimientos')) {
      if (pathname.includes('/ingreso')) {
        return { title: 'Nuevo Ingreso', subtitle: 'Registrar venta en efectivo' }
      }
      if (pathname.includes('/cobranza')) {
        return { title: 'Nueva Cobranza', subtitle: 'Cobrar a cliente' }
      }
      if (pathname.includes('/egreso')) {
        return { title: 'Nuevo Egreso', subtitle: 'Registrar pago a proveedor' }
      }
      if (pathname.includes('/gasto')) {
        return { title: 'Nuevo Gasto', subtitle: 'Registrar gasto operativo' }
      }
      if (pathname.includes('/traspaso')) {
        return { title: 'Nuevo Traspaso', subtitle: 'Transferir entre cuentas' }
      }
      return { title: 'Movimientos', subtitle: 'Gestión de movimientos financieros' }
    }

    if (pathname.startsWith('/dashboard/empleados')) {
      if (pathname.includes('/nuevo')) {
        return { title: 'Nuevo Empleado', subtitle: 'Agregar empleado al sistema' }
      }
      if (pathname.includes('/editar')) {
        return { title: 'Editar Empleado', subtitle: 'Modificar información del empleado' }
      }
      return { title: 'Empleados', subtitle: 'Gestión de empleados' }
    }

    if (pathname.startsWith('/dashboard/proveedores')) {
      if (pathname.includes('/nuevo')) {
        return { title: 'Nuevo Proveedor', subtitle: 'Agregar proveedor al sistema' }
      }
      if (pathname.includes('/editar')) {
        return { title: 'Editar Proveedor', subtitle: 'Modificar información del proveedor' }
      }
      return { title: 'Proveedores', subtitle: 'Gestión de proveedores' }
    }

    if (pathname.startsWith('/dashboard/clientes')) {
      if (pathname.includes('/nuevo')) {
        return { title: 'Nuevo Cliente', subtitle: 'Agregar cliente al sistema' }
      }
      if (pathname.includes('/editar')) {
        return { title: 'Editar Cliente', subtitle: 'Modificar información del cliente' }
      }
      return { title: 'Clientes', subtitle: 'Gestión de clientes' }
    }

    if (pathname.startsWith('/dashboard/categorias')) {
      if (pathname.includes('/nuevo')) {
        return { title: 'Nueva Categoría', subtitle: 'Agregar categoría al sistema' }
      }
      if (pathname.includes('/editar')) {
        return { title: 'Editar Categoría', subtitle: 'Modificar información de la categoría' }
      }
      return { title: 'Categorías', subtitle: 'Gestión de categorías' }
    }

    if (pathname.startsWith('/dashboard/subcategorias')) {
      if (pathname.includes('/nuevo')) {
        return { title: 'Nueva Subcategoría', subtitle: 'Agregar subcategoría al sistema' }
      }
      if (pathname.includes('/editar')) {
        return { title: 'Editar Subcategoría', subtitle: 'Modificar información de la subcategoría' }
      }
      return { title: 'Subcategorías', subtitle: 'Gestión de subcategorías' }
    }

    if (pathname.startsWith('/dashboard/empresas')) {
      return { title: 'Empresas', subtitle: 'Gestión de empresas del grupo' }
    }

    if (pathname.startsWith('/dashboard/cuentas')) {
      return { title: 'Cuentas', subtitle: 'Gestión de cuentas contables' }
    }

    if (pathname.startsWith('/dashboard/cortes')) {
      return { title: 'Cortes de Caja', subtitle: 'Gestión de cortes diarios' }
    }

    if (pathname.startsWith('/dashboard/catalogos')) {
      return { title: 'Catálogos', subtitle: 'Gestión de catálogos del sistema' }
    }

    // Fallback para rutas no reconocidas
    return { title: 'Dashboard', subtitle: 'Sistema Financiero Ballesteros' }
  }

  const { title, subtitle } = getPageInfo()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        title={title}
        subtitle={subtitle}
      />
      <div className="px-6 pb-6">
        {children}
      </div>
    </div>
  )
}