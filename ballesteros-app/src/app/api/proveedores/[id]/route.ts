import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para actualizar proveedor
const updateProveedorSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  telefono: z.string().max(20).optional().nullable(),
  activo: z.boolean().optional(),
  saldo_inicial: z.number().min(0).optional().default(0),
  empresa_activa_id: z.number().optional().nullable() // Para saldo inicial específico - permite null
})

// GET /api/proveedores/[id] - Obtener proveedor por ID
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
    const proveedorId = parseInt(id)
    if (isNaN(proveedorId)) {
      return NextResponse.json(
        { error: 'ID de proveedor inválido' },
        { status: 400 }
      )
    }

    const proveedor = await prisma.entidad.findUnique({
      where: {
        id: proveedorId,
        es_proveedor: true
      },
      include: {
        entidades_empresas: {
          include: {
            empresa: {
              select: { id: true, nombre: true }
            }
          }
        },
        saldos: {
          include: {
            empresas: {
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

    if (!proveedor) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Formatear respuesta para compatibilidad
    const proveedorFormateado = {
      ...proveedor,
      empresas: proveedor.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa.id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion
      })),
      saldos_por_empresa: proveedor.saldos.map(saldo => ({
        empresa_id: saldo.empresa_id,
        empresa_nombre: saldo.empresas?.nombre || 'Sin empresa',
        tipo_saldo: saldo.tipo_saldo,
        saldo_actual: Number(saldo.saldo_actual)
      })),
      contadores: {
        movimientos_como_proveedor: proveedor._count.movimientos_entidad
      }
    }

    // Remover campos internos
    delete (proveedorFormateado as any).entidades_empresas
    delete (proveedorFormateado as any).saldos
    delete (proveedorFormateado as any)._count

    return NextResponse.json({ proveedor: proveedorFormateado })
  } catch (error) {
    console.error('Error al obtener proveedor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/proveedores/[id] - Actualizar proveedor
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
    const proveedorId = parseInt(id)
    if (isNaN(proveedorId)) {
      return NextResponse.json(
        { error: 'ID de proveedor inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateProveedorSchema.parse(body)

    // Verificar que el proveedor existe
    const proveedorExistente = await prisma.entidad.findUnique({
      where: {
        id: proveedorId,
        es_proveedor: true
      }
    })

    if (!proveedorExistente) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Si se está actualizando el nombre, verificar que no exista otro proveedor con ese nombre
    if (validatedData.nombre) {
      const otroProveedor = await prisma.entidad.findFirst({
        where: {
          nombre: validatedData.nombre,
          es_proveedor: true,
          id: { not: proveedorId }
        }
      })

      if (otroProveedor) {
        return NextResponse.json(
          { error: 'Ya existe otro proveedor con ese nombre' },
          { status: 400 }
        )
      }
    }

    // Actualizar proveedor usando transacción
    const proveedor = await prisma.$transaction(async (tx) => {
      // Actualizar datos básicos del proveedor (excluir campos que no van en entidades)
      const { saldo_inicial, empresa_activa_id, ...proveedorData } = validatedData
      const proveedorActualizado = await tx.entidad.update({
        where: { id: proveedorId },
        data: proveedorData
      })

      // Si se especifica saldo inicial, crear/ajustar saldo solo en empresa activa
      if (saldo_inicial && saldo_inicial > 0 && validatedData.empresa_activa_id) {
        const saldoExistente = await tx.saldo.findFirst({
          where: {
            entidad_id: proveedorId,
            empresa_id: validatedData.empresa_activa_id,
            tipo_saldo: 'cuenta_pagar'
          }
        })

        if (!saldoExistente) {
          await tx.saldo.create({
            data: {
              entidad_id: proveedorId,
              empresa_id: validatedData.empresa_activa_id,
              tipo_saldo: 'cuenta_pagar',
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

      return proveedorActualizado
    })

    // Obtener proveedor completo con relaciones para respuesta
    const proveedorCompleto = await prisma.entidad.findUnique({
      where: { id: proveedorId },
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
    const proveedorFormateado = {
      ...proveedor,
      empresas: proveedorCompleto?.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa.id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion
      })) || []
    }

    return NextResponse.json({ proveedor: proveedorFormateado })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al actualizar proveedor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/proveedores/[id] - Eliminar proveedor (solo si no tiene cuentas por pagar o pagos)
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
    const proveedorId = parseInt(id)
    if (isNaN(proveedorId)) {
      return NextResponse.json(
        { error: 'ID de proveedor inválido' },
        { status: 400 }
      )
    }

    // Verificar que el proveedor existe
    const proveedor = await prisma.entidad.findUnique({
      where: {
        id: proveedorId,
        es_proveedor: true
      }
    })

    if (!proveedor) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no tenga movimientos activos pendientes
    const movimientosActivos = await prisma.movimiento.count({
      where: {
        entidad_relacionada_id: proveedorId
      }
    })

    if (movimientosActivos > 0) {
      return NextResponse.json(
        {
          error: 'No se puede desactivar proveedor con movimientos activos',
          movimientos_activos: movimientosActivos
        },
        { status: 400 }
      )
    }

    // Soft delete: marcar como inactivo
    const proveedorDesactivado = await prisma.entidad.update({
      where: { id: proveedorId },
      data: { activo: false }
    })

    return NextResponse.json({
      message: 'Proveedor desactivado exitosamente',
      proveedor: proveedorDesactivado
    })
  } catch (error) {
    console.error('Error al desactivar proveedor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}