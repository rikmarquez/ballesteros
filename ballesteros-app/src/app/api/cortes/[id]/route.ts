import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { actualizarCorteSchema, calcularCamposCorte } from '@/lib/validations/cortes'
import { z } from 'zod'

// GET /api/cortes/[id] - Obtener corte específico
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
    const corteId = parseInt(id)
    if (isNaN(corteId)) {
      return NextResponse.json({ error: 'ID de corte inválido' }, { status: 400 })
    }

    const corte = await prisma.corte.findUnique({
      where: { id: corteId },
      include: {
        empresa: {
          select: { id: true, nombre: true }
        },
        entidad: {
          select: { id: true, nombre: true, puesto: true }
        }
      }
    })

    if (!corte) {
      return NextResponse.json({ error: 'Corte no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ corte })

  } catch (error) {
    console.error('Error al obtener corte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/cortes/[id] - Actualizar corte (NUEVO FLUJO)
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
    const corteId = parseInt(id)
    if (isNaN(corteId)) {
      return NextResponse.json({ error: 'ID de corte inválido' }, { status: 400 })
    }

    const body = await request.json()
    console.log('Datos recibidos en PUT /api/cortes/[id]:', JSON.stringify(body, null, 2))

    // Validar datos con el esquema de actualización
    let validatedData
    try {
      validatedData = actualizarCorteSchema.parse(body)
    } catch (validationError) {
      console.error('Error de validación:', validationError)
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validationError instanceof z.ZodError ? validationError.errors : validationError.message
        },
        { status: 400 }
      )
    }

    // Verificar que el corte existe
    const corteExistente = await prisma.corte.findUnique({
      where: { id: corteId }
    })

    if (!corteExistente) {
      return NextResponse.json({ error: 'Corte no encontrado' }, { status: 404 })
    }

    // Preparar datos para actualización
    const updateData: any = {}

    // Campos manuales que se pueden actualizar
    if (validatedData.venta_neta !== undefined) {
      updateData.venta_neta = validatedData.venta_neta
    }

    // INGRESOS
    if (validatedData.venta_efectivo !== undefined) {
      updateData.venta_efectivo = validatedData.venta_efectivo
    }
    if (validatedData.venta_credito !== undefined) {
      updateData.venta_credito = validatedData.venta_credito
    }
    if (validatedData.venta_plataforma !== undefined) {
      updateData.venta_plataforma = validatedData.venta_plataforma
    }
    if (validatedData.cobranza !== undefined) {
      updateData.cobranza = validatedData.cobranza
    }

    // EGRESOS
    if (validatedData.venta_credito_tarjeta !== undefined) {
      updateData.venta_credito_tarjeta = validatedData.venta_credito_tarjeta
    }
    if (validatedData.venta_debito_tarjeta !== undefined) {
      updateData.venta_debito_tarjeta = validatedData.venta_debito_tarjeta
    }
    if (validatedData.venta_transferencia !== undefined) {
      updateData.venta_transferencia = validatedData.venta_transferencia
    }
    if (validatedData.retiro_parcial !== undefined) {
      updateData.retiro_parcial = validatedData.retiro_parcial
    }
    if (validatedData.gasto !== undefined) {
      updateData.gasto = validatedData.gasto
    }
    if (validatedData.compra !== undefined) {
      updateData.compra = validatedData.compra
    }
    if (validatedData.prestamo !== undefined) {
      updateData.prestamo = validatedData.prestamo
    }
    if (validatedData.cortesia !== undefined) {
      updateData.cortesia = validatedData.cortesia
    }
    if (validatedData.otros_retiros !== undefined) {
      updateData.otros_retiros = validatedData.otros_retiros
    }

    if (validatedData.tags !== undefined) {
      updateData.tags = validatedData.tags
    }
    if (validatedData.estado !== undefined) {
      updateData.estado = validatedData.estado
    }

    // Si hay cambios en los campos de cálculo, recalcular automáticamente
    if (Object.keys(updateData).some(key => key !== 'tags' && key !== 'estado')) {
      // Combinar datos existentes con actualizaciones para recalcular
      const datosParaCalculo = {
        venta_neta: updateData.venta_neta ?? corteExistente.venta_neta,
        venta_efectivo: updateData.venta_efectivo ?? corteExistente.venta_efectivo,
        venta_credito: updateData.venta_credito ?? corteExistente.venta_credito,
        venta_plataforma: updateData.venta_plataforma ?? corteExistente.venta_plataforma,
        cobranza: updateData.cobranza ?? corteExistente.cobranza,
        venta_credito_tarjeta: updateData.venta_credito_tarjeta ?? corteExistente.venta_credito_tarjeta,
        venta_debito_tarjeta: updateData.venta_debito_tarjeta ?? corteExistente.venta_debito_tarjeta,
        venta_transferencia: updateData.venta_transferencia ?? corteExistente.venta_transferencia,
        retiro_parcial: updateData.retiro_parcial ?? corteExistente.retiro_parcial,
        gasto: updateData.gasto ?? corteExistente.gasto,
        compra: updateData.compra ?? corteExistente.compra,
        prestamo: updateData.prestamo ?? corteExistente.prestamo,
        cortesia: updateData.cortesia ?? corteExistente.cortesia,
        otros_retiros: updateData.otros_retiros ?? corteExistente.otros_retiros,
      }

      // Calcular campos automáticamente
      const camposCalculados = calcularCamposCorte(datosParaCalculo as any)

      // Agregar campos calculados a la actualización
      updateData.venta_tarjeta = camposCalculados.venta_tarjeta
      updateData.total_ingresos = camposCalculados.total_ingresos
      updateData.total_egresos = camposCalculados.total_egresos
      updateData.efectivo_esperado = camposCalculados.efectivo_esperado
      updateData.diferencia = camposCalculados.diferencia
      updateData.adeudo_generado = camposCalculados.adeudo_generado
    }

    updateData.updated_at = new Date()

    // Actualizar el corte
    const corteActualizado = await prisma.corte.update({
      where: { id: corteId },
      data: updateData,
      include: {
        empresa: {
          select: { id: true, nombre: true }
        },
        entidad: {
          select: { id: true, nombre: true, puesto: true }
        }
      }
    })

    console.log('Corte actualizado exitosamente:', corteActualizado.id)

    return NextResponse.json({
      message: 'Corte actualizado exitosamente',
      corte: corteActualizado
    })

  } catch (error) {
    console.error('Error al actualizar corte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/cortes/[id] - Eliminar corte (cambiar estado a eliminado)
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
    const corteId = parseInt(id)
    if (isNaN(corteId)) {
      return NextResponse.json({ error: 'ID de corte inválido' }, { status: 400 })
    }

    // Verificar que el corte existe
    const corteExistente = await prisma.corte.findUnique({
      where: { id: corteId }
    })

    if (!corteExistente) {
      return NextResponse.json({ error: 'Corte no encontrado' }, { status: 404 })
    }

    // Cambiar estado a eliminado en lugar de eliminar físicamente
    const corteEliminado = await prisma.corte.update({
      where: { id: corteId },
      data: {
        estado: 'eliminado',
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      message: 'Corte eliminado exitosamente',
      corte: corteEliminado
    })

  } catch (error) {
    console.error('Error al eliminar corte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}