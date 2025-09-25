import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para actualizar cuenta
const updateCuentaSchema = z.object({
  tipo_cuenta: z.string().min(1).max(20).optional(),
  nombre: z.string().min(1).max(100).optional(),
  saldo_actual: z.coerce.number().min(0).optional(),
  activa: z.boolean().optional()
})

// GET /api/cuentas/[id] - Obtener cuenta por ID
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
    const cuentaId = parseInt(id)
    if (isNaN(cuentaId)) {
      return NextResponse.json(
        { error: 'ID de cuenta inválido' },
        { status: 400 }
      )
    }

    const cuenta = await prisma.cuenta.findUnique({
      where: { id: cuentaId },
      include: {
        _count: {
          select: {
            movimientos_origen: true,
            movimientos_destino: true
          }
        }
      }
    })

    if (!cuenta) {
      return NextResponse.json(
        { error: 'Cuenta no encontrada' },
        { status: 404 }
      )
    }

    // Transformar los datos para incluir total de movimientos
    const cuentaConMovimientos = {
      ...cuenta,
      _count: {
        ...cuenta._count,
        movimientos: cuenta._count.movimientos_origen + cuenta._count.movimientos_destino
      }
    }

    return NextResponse.json({ cuenta: cuentaConMovimientos })
  } catch (error) {
    console.error('Error al obtener cuenta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/cuentas/[id] - Actualizar cuenta
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
    const cuentaId = parseInt(id)
    if (isNaN(cuentaId)) {
      return NextResponse.json(
        { error: 'ID de cuenta inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateCuentaSchema.parse(body)

    // Verificar que la cuenta existe
    const cuentaExistente = await prisma.cuenta.findUnique({
      where: { id: cuentaId }
    })

    if (!cuentaExistente) {
      return NextResponse.json(
        { error: 'Cuenta no encontrada' },
        { status: 404 }
      )
    }

    // Si se está actualizando el nombre, verificar que no exista otra cuenta con ese nombre
    if (validatedData.nombre) {
      const otraCuenta = await prisma.cuenta.findFirst({
        where: {
          nombre: validatedData.nombre,
          id: { not: cuentaId }
        }
      })

      if (otraCuenta) {
        return NextResponse.json(
          { error: 'Ya existe otra cuenta con ese nombre' },
          { status: 400 }
        )
      }
    }

    const cuenta = await prisma.cuenta.update({
      where: { id: cuentaId },
      data: validatedData
    })

    return NextResponse.json({ cuenta })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Error de validación:', error.errors)
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.errors,
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      )
    }

    console.error('Error al actualizar cuenta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/cuentas/[id] - Desactivar cuenta (soft delete)
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
    const cuentaId = parseInt(id)
    if (isNaN(cuentaId)) {
      return NextResponse.json(
        { error: 'ID de cuenta inválido' },
        { status: 400 }
      )
    }

    // Verificar que la cuenta existe
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: cuentaId }
    })

    if (!cuenta) {
      return NextResponse.json(
        { error: 'Cuenta no encontrada' },
        { status: 404 }
      )
    }

    // Soft delete: marcar como inactiva
    const cuentaDesactivada = await prisma.cuenta.update({
      where: { id: cuentaId },
      data: { activa: false }
    })

    return NextResponse.json({
      message: 'Cuenta desactivada exitosamente',
      cuenta: cuentaDesactivada
    })
  } catch (error) {
    console.error('Error al desactivar cuenta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}