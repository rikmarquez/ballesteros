import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para actualizar cliente
const updateClienteSchema = z.object({
  empresa_id: z.number().int().positive().optional(),
  nombre: z.string().min(1).max(255).optional(),
  telefono: z.string().max(20).optional(),
  saldo_inicial: z.number().optional().transform(val => val ? Number(val.toFixed(2)) : val)
})

// GET /api/clientes/[id] - Obtener cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const clienteId = parseInt(params.id)
    if (isNaN(clienteId)) {
      return NextResponse.json(
        { error: 'ID de cliente inválido' },
        { status: 400 }
      )
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
            activa: true
          }
        },
        movimientos: {
          select: {
            id: true,
            tipo: true,
            fecha: true,
            monto: true,
            referencia: true
          },
          orderBy: { fecha: 'desc' },
          take: 20
        },
        ventas_credito: {
          select: {
            id: true,
            monto: true,
            forma_pago: true,
            corte: {
              select: {
                fecha: true,
                empresa: { select: { nombre: true } }
              }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 10
        },
        _count: {
          select: {
            movimientos: true,
            ventas_credito: true,
            ingresos_turno: true
          }
        }
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Calcular saldo actual
    const saldoActual = await prisma.movimientoCliente.aggregate({
      where: { cliente_id: clienteId },
      _sum: {
        monto: true
      }
    })

    const saldo_actual = cliente.saldo_inicial + (saldoActual._sum.monto || 0)

    return NextResponse.json({
      cliente: {
        ...cliente,
        saldo_actual: Number(saldo_actual.toFixed(2))
      }
    })
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/clientes/[id] - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const clienteId = parseInt(params.id)
    if (isNaN(clienteId)) {
      return NextResponse.json(
        { error: 'ID de cliente inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateClienteSchema.parse(body)

    // Verificar que el cliente existe
    const clienteExistente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    })

    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Si se está cambiando la empresa, verificar que existe y está activa
    if (validatedData.empresa_id) {
      const empresa = await prisma.empresa.findUnique({
        where: { id: validatedData.empresa_id }
      })

      if (!empresa || !empresa.activa) {
        return NextResponse.json(
          { error: 'Nueva empresa no encontrada o inactiva' },
          { status: 400 }
        )
      }
    }

    // Si se está actualizando el nombre o empresa, verificar unicidad
    if (validatedData.nombre || validatedData.empresa_id) {
      const empresa_id = validatedData.empresa_id || clienteExistente.empresa_id
      const nombre = validatedData.nombre || clienteExistente.nombre

      const otroCliente = await prisma.cliente.findFirst({
        where: {
          empresa_id: empresa_id,
          nombre: nombre,
          id: { not: clienteId }
        }
      })

      if (otroCliente) {
        return NextResponse.json(
          { error: 'Ya existe otro cliente con ese nombre en esa empresa' },
          { status: 400 }
        )
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: validatedData,
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    return NextResponse.json({ cliente })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al actualizar cliente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/clientes/[id] - Eliminar cliente (solo si no tiene movimientos)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const clienteId = parseInt(params.id)
    if (isNaN(clienteId)) {
      return NextResponse.json(
        { error: 'ID de cliente inválido' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        _count: {
          select: {
            movimientos: true,
            ventas_credito: true,
            ingresos_turno: true
          }
        }
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no tenga movimientos asociados
    const totalMovimientos = cliente._count.movimientos + cliente._count.ventas_credito + cliente._count.ingresos_turno

    if (totalMovimientos > 0) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar cliente con movimientos asociados',
          movimientos: cliente._count.movimientos,
          ventas_credito: cliente._count.ventas_credito,
          ingresos_turno: cliente._count.ingresos_turno
        },
        { status: 400 }
      )
    }

    // Eliminar cliente (hard delete ya que no tiene movimientos)
    await prisma.cliente.delete({
      where: { id: clienteId }
    })

    return NextResponse.json({
      message: 'Cliente eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}