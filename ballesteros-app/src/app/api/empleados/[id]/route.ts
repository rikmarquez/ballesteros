import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para actualizar empleado
const updateEmpleadoSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  telefono: z.string().max(20).optional(),
  puesto: z.string().max(100).optional(),
  puede_operar_caja: z.boolean().optional(),
  activo: z.boolean().optional()
})

// GET /api/empleados/[id] - Obtener empleado por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const empleadoId = parseInt(params.id)
    if (isNaN(empleadoId)) {
      return NextResponse.json(
        { error: 'ID de empleado inválido' },
        { status: 400 }
      )
    }

    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId },
      include: {
        cortes: {
          select: {
            id: true,
            fecha: true,
            empresa: { select: { nombre: true } },
            venta_neta: true,
            diferencia: true
          },
          orderBy: { fecha: 'desc' },
          take: 10
        },
        prestamos: {
          select: {
            id: true,
            tipo: true,
            fecha: true,
            monto: true,
            origen: true
          },
          orderBy: { fecha: 'desc' },
          take: 10
        },
        _count: {
          select: {
            cortes: true,
            prestamos: true
          }
        }
      }
    })

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ empleado })
  } catch (error) {
    console.error('Error al obtener empleado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/empleados/[id] - Actualizar empleado
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const empleadoId = parseInt(params.id)
    if (isNaN(empleadoId)) {
      return NextResponse.json(
        { error: 'ID de empleado inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateEmpleadoSchema.parse(body)

    // Verificar que el empleado existe
    const empleadoExistente = await prisma.empleado.findUnique({
      where: { id: empleadoId }
    })

    if (!empleadoExistente) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    // Si se está actualizando el nombre, verificar que no exista otro empleado con ese nombre
    if (validatedData.nombre) {
      const otroEmpleado = await prisma.empleado.findFirst({
        where: {
          nombre: validatedData.nombre,
          id: { not: empleadoId }
        }
      })

      if (otroEmpleado) {
        return NextResponse.json(
          { error: 'Ya existe otro empleado con ese nombre' },
          { status: 400 }
        )
      }
    }

    const empleado = await prisma.empleado.update({
      where: { id: empleadoId },
      data: validatedData
    })

    return NextResponse.json({ empleado })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al actualizar empleado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/empleados/[id] - Desactivar empleado (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const empleadoId = parseInt(params.id)
    if (isNaN(empleadoId)) {
      return NextResponse.json(
        { error: 'ID de empleado inválido' },
        { status: 400 }
      )
    }

    // Verificar que el empleado existe
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId }
    })

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no tenga cortes activos
    const cortesActivos = await prisma.corteCaja.count({
      where: {
        empleado_id: empleadoId,
        estado: 'activo'
      }
    })

    if (cortesActivos > 0) {
      return NextResponse.json(
        {
          error: 'No se puede desactivar empleado con cortes activos',
          cortes_activos: cortesActivos
        },
        { status: 400 }
      )
    }

    // Soft delete: marcar como inactivo
    const empleadoDesactivado = await prisma.empleado.update({
      where: { id: empleadoId },
      data: { activo: false }
    })

    return NextResponse.json({
      message: 'Empleado desactivado exitosamente',
      empleado: empleadoDesactivado
    })
  } catch (error) {
    console.error('Error al desactivar empleado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}