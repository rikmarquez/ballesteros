import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para actualizar empleado
const updateEmpleadoSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  telefono: z.string().max(20).optional().nullable(),
  puesto: z.string().max(100).optional().nullable(),
  puede_operar_caja: z.boolean().optional(),
  activo: z.boolean().optional()
})

// GET /api/empleados/[id] - Obtener empleado por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const empleadoId = parseInt(id)
    if (isNaN(empleadoId)) {
      return NextResponse.json(
        { error: 'ID de empleado inválido' },
        { status: 400 }
      )
    }

    const empleado = await prisma.entidad.findUnique({
      where: {
        id: empleadoId,
        es_empleado: true
      },
      include: {
        entidades_empresas: {
          include: {
            empresa: {
              select: { id: true, nombre: true }
            }
          }
        },
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
        movimientos_empleado: {
          select: {
            id: true,
            tipo_movimiento: true,
            fecha: true,
            monto: true,
            referencia: true
          },
          orderBy: { fecha: 'desc' },
          take: 10
        },
        _count: {
          select: {
            cortes: true,
            movimientos_empleado: true
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

    // Formatear respuesta para compatibilidad
    const empleadoFormateado = {
      ...empleado,
      empresas: empleado.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa.id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion
      })),
      contadores: {
        movimientos_como_empleado: empleado._count.movimientos_empleado,
        cortes: empleado._count.cortes
      }
    }

    // Remover campos internos
    delete (empleadoFormateado as any).entidades_empresas
    delete (empleadoFormateado as any)._count

    return NextResponse.json({ empleado: empleadoFormateado })
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const empleadoId = parseInt(id)
    if (isNaN(empleadoId)) {
      return NextResponse.json(
        { error: 'ID de empleado inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateEmpleadoSchema.parse(body)

    // Verificar que el empleado existe
    const empleadoExistente = await prisma.entidad.findUnique({
      where: {
        id: empleadoId,
        es_empleado: true
      }
    })

    if (!empleadoExistente) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    // Si se está actualizando el nombre, verificar que no exista otro empleado con ese nombre
    if (validatedData.nombre) {
      const otroEmpleado = await prisma.entidad.findFirst({
        where: {
          nombre: validatedData.nombre,
          es_empleado: true,
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

    // Actualizar empleado (las empresas se mantienen automáticamente)
    const empleado = await prisma.entidad.update({
      where: { id: empleadoId },
      data: validatedData
    })

    // Obtener empleado completo con relaciones para respuesta
    const empleadoCompleto = await prisma.entidad.findUnique({
      where: { id: empleadoId },
      include: {
        entidades_empresas: {
          include: {
            empresa: {
              select: { id: true, nombre: true }
            }
          }
        }
      }
    })

    // Formatear respuesta
    const empleadoFormateado = {
      ...empleado,
      empresas: empleadoCompleto?.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa.id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion
      })) || []
    }

    return NextResponse.json({ empleado: empleadoFormateado })
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const empleadoId = parseInt(id)
    if (isNaN(empleadoId)) {
      return NextResponse.json(
        { error: 'ID de empleado inválido' },
        { status: 400 }
      )
    }

    // Verificar que el empleado existe
    const empleado = await prisma.entidad.findUnique({
      where: {
        id: empleadoId,
        es_empleado: true
      }
    })

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no tenga cortes activos
    const cortesActivos = await prisma.corte.count({
      where: {
        entidad_id: empleadoId,
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
    const empleadoDesactivado = await prisma.entidad.update({
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