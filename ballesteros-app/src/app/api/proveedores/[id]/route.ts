import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para actualizar proveedor
const updateProveedorSchema = z.object({
  empresa_id: z.number().int().positive().optional(),
  nombre: z.string().min(1).max(255).optional()
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

    const proveedor = await prisma.proveedor.findUnique({
      where: { id: proveedorId },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
            activa: true
          }
        },
        cuentas_pagar: {
          select: {
            id: true,
            fecha_compra: true,
            monto: true,
            numero_factura: true,
            fecha_vencimiento: true,
            estado: true,
            saldo_pendiente: true,
            categoria: { select: { nombre: true } },
            subcategoria: { select: { nombre: true } }
          },
          orderBy: { fecha_compra: 'desc' },
          take: 20
        },
        pagos: {
          select: {
            id: true,
            fecha: true,
            monto: true,
            forma_pago: true,
            referencia: true
          },
          orderBy: { fecha: 'desc' },
          take: 20
        },
        _count: {
          select: {
            cuentas_pagar: true,
            pagos: true
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

    // Calcular totales
    const totalCuentasPagar = await prisma.cuentaPorPagar.aggregate({
      where: { proveedor_id: proveedorId },
      _sum: {
        saldo_pendiente: true
      }
    })

    const totalPagos = await prisma.pagoProveedor.aggregate({
      where: { proveedor_id: proveedorId },
      _sum: {
        monto: true
      }
    })

    return NextResponse.json({
      proveedor: {
        ...proveedor,
        total_saldo_pendiente: Number((totalCuentasPagar._sum.saldo_pendiente || 0).toFixed(2)),
        total_pagos: Number((totalPagos._sum.monto || 0).toFixed(2))
      }
    })
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
    const proveedorExistente = await prisma.proveedor.findUnique({
      where: { id: proveedorId }
    })

    if (!proveedorExistente) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
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
      const empresa_id = validatedData.empresa_id || proveedorExistente.empresa_id
      const nombre = validatedData.nombre || proveedorExistente.nombre

      const otroProveedor = await prisma.proveedor.findFirst({
        where: {
          empresa_id: empresa_id,
          nombre: nombre,
          id: { not: proveedorId }
        }
      })

      if (otroProveedor) {
        return NextResponse.json(
          { error: 'Ya existe otro proveedor con ese nombre en esa empresa' },
          { status: 400 }
        )
      }
    }

    const proveedor = await prisma.proveedor.update({
      where: { id: proveedorId },
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

    return NextResponse.json({ proveedor })
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
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: proveedorId },
      include: {
        _count: {
          select: {
            cuentas_pagar: true,
            pagos: true
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

    // Verificar que no tenga cuentas por pagar o pagos asociados
    const totalRegistros = proveedor._count.cuentas_pagar + proveedor._count.pagos

    if (totalRegistros > 0) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar proveedor con registros asociados',
          cuentas_pagar: proveedor._count.cuentas_pagar,
          pagos: proveedor._count.pagos
        },
        { status: 400 }
      )
    }

    // Eliminar proveedor (hard delete ya que no tiene registros)
    await prisma.proveedor.delete({
      where: { id: proveedorId }
    })

    return NextResponse.json({
      message: 'Proveedor eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error al eliminar proveedor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}