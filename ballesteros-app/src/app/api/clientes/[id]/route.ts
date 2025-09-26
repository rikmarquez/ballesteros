import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para actualizar cliente
const updateClienteSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  telefono: z.string().max(20).optional().nullable(),
  activo: z.boolean().optional(),
  saldo_inicial: z.number().min(0).optional().default(0)
})

// GET /api/clientes/[id] - Obtener cliente por ID
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
    const clienteId = parseInt(id)
    if (isNaN(clienteId)) {
      return NextResponse.json(
        { error: 'ID de cliente inválido' },
        { status: 400 }
      )
    }

    const cliente = await prisma.entidad.findUnique({
      where: {
        id: clienteId,
        es_cliente: true
      },
      include: {
        entidades_empresas: {
          include: {
            empresa: {
              select: { id: true, nombre: true }
            }
          }
        },
        movimientos_entidad: {
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
            movimientos_entidad: true
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

    // Formatear respuesta para compatibilidad
    const clienteFormateado = {
      ...cliente,
      empresas: cliente.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa.id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion
      })),
      contadores: {
        movimientos_como_cliente: cliente._count.movimientos_entidad
      }
    }

    // Remover campos internos
    delete (clienteFormateado as any).entidades_empresas
    delete (clienteFormateado as any)._count

    return NextResponse.json({ cliente: clienteFormateado })
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const clienteId = parseInt(id)
    if (isNaN(clienteId)) {
      return NextResponse.json(
        { error: 'ID de cliente inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateClienteSchema.parse(body)

    // Verificar que el cliente existe
    const clienteExistente = await prisma.entidad.findUnique({
      where: {
        id: clienteId,
        es_cliente: true
      }
    })

    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Si se está actualizando el nombre, verificar que no exista otro cliente con ese nombre
    if (validatedData.nombre) {
      const otroCliente = await prisma.entidad.findFirst({
        where: {
          nombre: validatedData.nombre,
          es_cliente: true,
          id: { not: clienteId }
        }
      })

      if (otroCliente) {
        return NextResponse.json(
          { error: 'Ya existe otro cliente con ese nombre' },
          { status: 400 }
        )
      }
    }

    // Actualizar cliente usando transacción
    const cliente = await prisma.$transaction(async (tx) => {
      // Actualizar datos básicos del cliente
      const { saldo_inicial, ...clienteData } = validatedData
      const clienteActualizado = await tx.entidad.update({
        where: { id: clienteId },
        data: clienteData
      })

      // Si se especifica saldo inicial, crear/ajustar saldos
      if (saldo_inicial && saldo_inicial > 0) {
        // Obtener todas las empresas activas
        const empresasActivas = await tx.empresa.findMany({
          where: { activa: true }
        })

        // Crear saldos para cada empresa activa si no existen
        for (const empresa of empresasActivas) {
          const saldoExistente = await tx.saldo.findFirst({
            where: {
              entidad_id: clienteId,
              empresa_id: empresa.id,
              tipo_saldo: 'cuenta_cobrar'
            }
          })

          if (!saldoExistente) {
            await tx.saldo.create({
              data: {
                entidad_id: clienteId,
                empresa_id: empresa.id,
                tipo_saldo: 'cuenta_cobrar',
                saldo_inicial: saldo_inicial,
                saldo_actual: saldo_inicial,
                total_cargos: saldo_inicial,
                total_abonos: 0
              }
            })
          } else {
            // Ajustar saldo existente
            const nuevoCargo = saldo_inicial
            await tx.saldo.update({
              where: { id: saldoExistente.id },
              data: {
                total_cargos: saldoExistente.total_cargos + nuevoCargo,
                saldo_actual: saldoExistente.saldo_actual + nuevoCargo
              }
            })
          }
        }
      }

      return clienteActualizado
    })

    // Obtener cliente completo con relaciones para respuesta
    const clienteCompleto = await prisma.entidad.findUnique({
      where: { id: clienteId },
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
    const clienteFormateado = {
      ...cliente,
      empresas: clienteCompleto?.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa.id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion
      })) || []
    }

    return NextResponse.json({ cliente: clienteFormateado })
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const clienteId = parseInt(id)
    if (isNaN(clienteId)) {
      return NextResponse.json(
        { error: 'ID de cliente inválido' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const cliente = await prisma.entidad.findUnique({
      where: {
        id: clienteId,
        es_cliente: true
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no tenga movimientos activos pendientes
    const movimientosActivos = await prisma.movimiento.count({
      where: {
        entidad_relacionada_id: clienteId
      }
    })

    if (movimientosActivos > 0) {
      return NextResponse.json(
        {
          error: 'No se puede desactivar cliente con movimientos activos',
          movimientos_activos: movimientosActivos
        },
        { status: 400 }
      )
    }

    // Soft delete: marcar como inactivo
    const clienteDesactivado = await prisma.entidad.update({
      where: { id: clienteId },
      data: { activo: false }
    })

    return NextResponse.json({
      message: 'Cliente desactivado exitosamente',
      cliente: clienteDesactivado
    })
  } catch (error) {
    console.error('Error al desactivar cliente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}