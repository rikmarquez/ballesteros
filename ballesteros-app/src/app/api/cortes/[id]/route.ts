import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/cortes/[id] - Obtener detalle de corte específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const corteId = parseInt(params.id)
    if (isNaN(corteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const corte = await prisma.corteCaja.findUnique({
      where: { id: corteId },
      include: {
        empresa: {
          select: { id: true, nombre: true }
        },
        empleado: {
          select: { id: true, nombre: true, puesto: true, telefono: true }
        },
        ventas: {
          include: {
            cliente: {
              select: { id: true, nombre: true }
            }
          },
          orderBy: { created_at: 'asc' }
        },
        cortesias: {
          orderBy: { id: 'asc' }
        },
        ingresos_turno: {
          include: {
            cliente: {
              select: { id: true, nombre: true }
            }
          },
          orderBy: { id: 'asc' }
        },
        egresos_turno: {
          include: {
            categoria: {
              select: { id: true, nombre: true, tipo: true }
            },
            subcategoria: {
              select: { id: true, nombre: true }
            }
          },
          orderBy: { id: 'asc' }
        }
      }
    })

    if (!corte) {
      return NextResponse.json({ error: 'Corte no encontrado' }, { status: 404 })
    }

    // Calcular resumen del corte
    const resumen = {
      total_ventas_efectivo: corte.ventas
        .filter(v => v.forma_pago === 'efectivo')
        .reduce((sum, v) => sum + Number(v.monto), 0),
      total_ventas_tarjeta: corte.ventas
        .filter(v => v.forma_pago === 'tarjeta')
        .reduce((sum, v) => sum + Number(v.monto), 0),
      total_ventas_credito: corte.ventas
        .filter(v => v.forma_pago === 'credito')
        .reduce((sum, v) => sum + Number(v.monto), 0),
      total_cortesias: corte.cortesias
        .reduce((sum, c) => sum + Number(c.monto), 0),
      total_ingresos: corte.ingresos_turno
        .reduce((sum, i) => sum + Number(i.monto), 0),
      total_egresos: corte.egresos_turno
        .reduce((sum, e) => sum + Number(e.monto), 0)
    }

    return NextResponse.json({
      corte,
      resumen
    })

  } catch (error) {
    console.error('Error al obtener corte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/cortes/[id] - Actualizar corte
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const corteId = parseInt(params.id)
    if (isNaN(corteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const {
      venta_neta,
      efectivo_real,
      tags,
      estado
    } = body

    // Verificar que el corte existe
    const corteExistente = await prisma.corteCaja.findUnique({
      where: { id: corteId }
    })

    if (!corteExistente) {
      return NextResponse.json({ error: 'Corte no encontrado' }, { status: 404 })
    }

    // Preparar datos de actualización
    const updateData: any = {}

    if (venta_neta !== undefined) {
      updateData.venta_neta = parseFloat(venta_neta)

      // Recalcular efectivo esperado si cambió la venta neta
      updateData.efectivo_esperado = await calcularEfectivoEsperado(
        corteExistente.empresa_id,
        corteExistente.empleado_id,
        corteExistente.fecha,
        parseFloat(venta_neta)
      )
    }

    if (efectivo_real !== undefined) {
      updateData.efectivo_real = efectivo_real ? parseFloat(efectivo_real) : null
    }

    if (tags !== undefined) {
      updateData.tags = tags
    }

    if (estado !== undefined) {
      updateData.estado = estado
    }

    // Recalcular diferencia si se actualizó efectivo real o esperado
    if (updateData.efectivo_real !== undefined || updateData.efectivo_esperado !== undefined) {
      const efectivoEsperado = updateData.efectivo_esperado ?? Number(corteExistente.efectivo_esperado)
      const efectivoReal = updateData.efectivo_real ?? Number(corteExistente.efectivo_real)

      if (efectivoReal !== null && efectivoEsperado !== null) {
        updateData.diferencia = efectivoReal - efectivoEsperado

        // Verificar si se debe generar/remover adeudo
        const tolerancia = 50
        const adeudoGenerado = updateData.diferencia < -tolerancia
        updateData.adeudo_generado = adeudoGenerado

        // TODO: Actualizar registros de préstamos de empleado si es necesario
      }
    }

    const corteActualizado = await prisma.corteCaja.update({
      where: { id: corteId },
      data: updateData,
      include: {
        empresa: {
          select: { id: true, nombre: true }
        },
        empleado: {
          select: { id: true, nombre: true, puesto: true }
        }
      }
    })

    return NextResponse.json(corteActualizado)

  } catch (error) {
    console.error('Error al actualizar corte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/cortes/[id] - Eliminar corte (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const corteId = parseInt(params.id)
    if (isNaN(corteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Soft delete - cambiar estado a 'eliminado'
    const corteEliminado = await prisma.corteCaja.update({
      where: { id: corteId },
      data: { estado: 'eliminado' }
    })

    return NextResponse.json({ message: 'Corte eliminado correctamente' })

  } catch (error) {
    console.error('Error al eliminar corte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función auxiliar para calcular efectivo esperado
async function calcularEfectivoEsperado(
  empresa_id: number,
  empleado_id: number,
  fecha: Date,
  venta_neta: number
): Promise<number> {
  try {
    // TODO: Implementar lógica completa
    // Por ahora, lógica simplificada: 85% de la venta neta es efectivo
    const porcentajeEfectivo = 0.85
    return venta_neta * porcentajeEfectivo

  } catch (error) {
    console.error('Error al calcular efectivo esperado:', error)
    return venta_neta * 0.85
  }
}