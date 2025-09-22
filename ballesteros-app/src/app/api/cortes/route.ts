import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para actualizar corte
const updateCorteSchema = z.object({
  venta_neta: z.number().positive().optional(),
  tags: z.string().optional(),
  movimientos: z.array(z.object({
    id: z.string(),
    tipo: z.enum([
      'venta_efectivo', 'venta_tarjeta', 'venta_credito', 'venta_transferencia',
      'cortesia', 'cobranza', 'retiro_parcial', 'gasto', 'compra', 'prestamo', 'otros_retiros'
    ]),
    monto: z.number().positive(),
    descripcion: z.string().optional(),
    cliente_id: z.number().nullable().optional(),
    categoria_id: z.number().nullable().optional(),
    subcategoria_id: z.number().nullable().optional(),
    relacionado_id: z.number().nullable().optional(),
    empleado_id: z.number().nullable().optional(),
    beneficiario: z.string().optional()
  })).optional()
})

// GET /api/cortes - Listar cortes con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const empresa_id = searchParams.get('empresa_id')
    const empleado_id = searchParams.get('empleado_id')
    const fecha = searchParams.get('fecha')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    if (empresa_id && empresa_id !== 'all') {
      const empresaIdNum = parseInt(empresa_id)
      if (!isNaN(empresaIdNum)) {
        where.empresa_id = empresaIdNum
      }
    }

    if (empleado_id && empleado_id !== 'all') {
      const empleadoIdNum = parseInt(empleado_id)
      if (!isNaN(empleadoIdNum)) {
        where.empleado_id = empleadoIdNum
      }
    }

    if (fecha) {
      where.fecha = new Date(fecha)
    }

    const cortes = await prisma.corteCaja.findMany({
      where,
      include: {
        empresa: {
          select: { id: true, nombre: true }
        },
        empleado: {
          select: { id: true, nombre: true, puesto: true }
        },
        ventas: true,
        cortesias: true,
        ingresos_turno: true,
        egresos_turno: true
      },
      orderBy: [
        { fecha: 'desc' },
        { created_at: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    const total = await prisma.corteCaja.count({ where })

    return NextResponse.json({
      cortes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error al obtener cortes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/cortes - Crear nuevo corte completo con movimientos
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      empresa_id,
      empleado_id,
      fecha,
      sesion,
      venta_neta,
      efectivo_real,
      diferencia,
      tags,
      movimientos = []
    } = body

    // Validación básica
    if (!empresa_id || !empleado_id || !fecha || !venta_neta || efectivo_real === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    if (movimientos.length === 0) {
      return NextResponse.json(
        { error: 'Debe registrar al menos un movimiento de efectivo' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un corte para la misma empresa, empleado, fecha y sesión
    const existingCorte = await prisma.corteCaja.findUnique({
      where: {
        empresa_id_empleado_id_fecha_sesion: {
          empresa_id: parseInt(empresa_id),
          empleado_id: parseInt(empleado_id),
          fecha: new Date(fecha),
          sesion: parseInt(sesion) || 1
        }
      }
    })

    if (existingCorte) {
      return NextResponse.json(
        { error: 'Ya existe un corte para esta empresa, empleado, fecha y sesión' },
        { status: 400 }
      )
    }

    // Separar movimientos por tipo para cálculo
    const ingresos = movimientos.filter((m: any) => ['venta_efectivo', 'cobranza'].includes(m.tipo))
    const egresos = movimientos.filter((m: any) => [
      'retiro_parcial', 'venta_tarjeta', 'venta_transferencia',
      'gasto', 'compra', 'prestamo', 'cortesia', 'otros_retiros'
    ].includes(m.tipo))

    // Calcular efectivo esperado: (Venta Neta + Cobranza) - (Todos los egresos)
    const ventaNetaNum = parseFloat(venta_neta)
    const totalCobranza = ingresos
      .filter((m: any) => m.tipo === 'cobranza')
      .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0)
    const totalEgresos = egresos
      .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0)

    const efectivoEsperadoNum = ventaNetaNum + totalCobranza - totalEgresos
    const efectivoRealNum = parseFloat(efectivo_real)
    const diferenciaNum = efectivoRealNum - efectivoEsperadoNum

    // Determinar si se genera adeudo (faltante mayor a tolerancia)
    const tolerancia = 50 // $50 pesos de tolerancia
    const adeudoGenerado = diferenciaNum < -tolerancia

    // Crear el corte con todos sus movimientos en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear el corte principal
      const nuevoCorte = await tx.corteCaja.create({
        data: {
          empresa_id: parseInt(empresa_id),
          empleado_id: parseInt(empleado_id),
          fecha: new Date(fecha),
          sesion: parseInt(sesion) || 1,
          venta_neta: ventaNetaNum,
          efectivo_esperado: efectivoEsperadoNum,
          efectivo_real: efectivoRealNum,
          diferencia: diferenciaNum,
          tags: tags || null,
          adeudo_generado: adeudoGenerado
        }
      })

      // 2. Procesar movimientos de efectivo y almacenar en las tablas apropiadas
      if (movimientos.length > 0) {
        for (const movimiento of movimientos) {
          const monto = parseFloat(movimiento.monto)

          switch (movimiento.tipo) {
            case 'venta_efectivo':
              await tx.ventaCorte.create({
                data: {
                  corte_id: nuevoCorte.id,
                  forma_pago: 'efectivo',
                  monto: monto,
                  cliente_id: movimiento.cliente_id || null,
                  tags: movimiento.descripcion || 'Venta en efectivo'
                }
              })
              break

            case 'cobranza':
              await tx.ingresoTurno.create({
                data: {
                  corte_id: nuevoCorte.id,
                  tipo: 'cobranza',
                  monto: monto,
                  cliente_id: movimiento.cliente_id || null,
                  tags: movimiento.descripcion || 'Cobranza'
                }
              })
              break

            case 'venta_tarjeta':
              await tx.ventaCorte.create({
                data: {
                  corte_id: nuevoCorte.id,
                  forma_pago: 'tarjeta',
                  monto: monto,
                  cliente_id: movimiento.cliente_id || null,
                  tags: movimiento.descripcion || 'Venta con tarjeta'
                }
              })
              break

            case 'venta_transferencia':
              await tx.ventaCorte.create({
                data: {
                  corte_id: nuevoCorte.id,
                  forma_pago: 'transferencia',
                  monto: monto,
                  cliente_id: movimiento.cliente_id || null,
                  tags: movimiento.descripcion || 'Venta por transferencia'
                }
              })
              break

            case 'venta_credito':
              await tx.ventaCorte.create({
                data: {
                  corte_id: nuevoCorte.id,
                  forma_pago: 'credito',
                  monto: monto,
                  cliente_id: movimiento.cliente_id || null,
                  tags: movimiento.descripcion || 'Venta a crédito'
                }
              })
              break

            case 'gasto':
            case 'compra':
              await tx.egresoTurno.create({
                data: {
                  corte_id: nuevoCorte.id,
                  tipo: movimiento.tipo,
                  monto: monto,
                  categoria_id: movimiento.categoria_id || null,
                  subcategoria_id: movimiento.subcategoria_id || null,
                  relacionado_id: movimiento.relacionado_id || null,
                  descripcion: movimiento.descripcion || null,
                  tags: movimiento.descripcion || null
                }
              })
              break

            case 'cortesia':
              await tx.cortesiaCorte.create({
                data: {
                  corte_id: nuevoCorte.id,
                  monto: monto,
                  beneficiario: movimiento.beneficiario || 'No especificado',
                  tags: movimiento.descripcion || 'Cortesía'
                }
              })
              break

            case 'prestamo':
              await tx.egresoTurno.create({
                data: {
                  corte_id: nuevoCorte.id,
                  tipo: 'prestamo',
                  monto: monto,
                  relacionado_id: movimiento.empleado_id || null,
                  descripcion: movimiento.descripcion || null,
                  tags: movimiento.descripcion || 'Préstamo a empleado'
                }
              })
              break

            case 'retiro_parcial':
            case 'otros_retiros':
              await tx.egresoTurno.create({
                data: {
                  corte_id: nuevoCorte.id,
                  tipo: movimiento.tipo,
                  monto: monto,
                  descripcion: movimiento.descripcion || null,
                  tags: movimiento.descripcion || null
                }
              })
              break
          }
        }
      }

      // 3. Si hay adeudo, crear registro en préstamos de empleado
      if (adeudoGenerado) {
        await tx.prestamoEmpleado.create({
          data: {
            empleado_id: parseInt(empleado_id),
            tipo: 'adeudo_faltante',
            fecha: new Date(fecha),
            monto: Math.abs(diferenciaNum),
            origen: 'corte_caja',
            corte_id: nuevoCorte.id,
            referencia: `Adeudo por faltante en corte #${nuevoCorte.id} (${Math.abs(diferenciaNum).toFixed(2)})`
          }
        })
      }

      // 4. Obtener el corte completo con todas las relaciones
      const corteCompleto = await tx.corteCaja.findUnique({
        where: { id: nuevoCorte.id },
        include: {
          empresa: {
            select: { id: true, nombre: true }
          },
          empleado: {
            select: { id: true, nombre: true, puesto: true }
          },
          ventas: true,
          cortesias: true,
          ingresos_turno: true,
          egresos_turno: {
            include: {
              categoria: { select: { nombre: true } },
              subcategoria: { select: { nombre: true } }
            }
          }
        }
      })

      return corteCompleto
    })

    return NextResponse.json({
      message: 'Corte creado exitosamente',
      corte: resultado
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear corte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/cortes - Actualizar corte existente (solo efectivo_real, venta_neta y movimientos)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const corteId = searchParams.get('id')

    if (!corteId) {
      return NextResponse.json(
        { error: 'ID de corte requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('Datos recibidos en PUT /api/cortes:', JSON.stringify(body, null, 2))

    let validatedData
    try {
      validatedData = updateCorteSchema.parse(body)
      console.log('Datos validados exitosamente:', JSON.stringify(validatedData, null, 2))
    } catch (validationError) {
      console.error('Error de validación Zod:', validationError)
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationError.errors || validationError.message },
        { status: 400 }
      )
    }

    // Verificar que el corte existe
    const corteExistente = await prisma.corteCaja.findUnique({
      where: { id: parseInt(corteId) },
      include: {
        ventas: true,
        cortesias: true,
        ingresos_turno: true,
        egresos_turno: true
      }
    })

    if (!corteExistente) {
      return NextResponse.json(
        { error: 'Corte no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el corte en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Si se proporcionan nuevos movimientos, eliminar los existentes y crear los nuevos
      if (validatedData.movimientos) {
        // Eliminar movimientos existentes
        await tx.ventaCorte.deleteMany({ where: { corte_id: parseInt(corteId) } })
        await tx.ingresoTurno.deleteMany({ where: { corte_id: parseInt(corteId) } })
        await tx.egresoTurno.deleteMany({ where: { corte_id: parseInt(corteId) } })
        await tx.cortesiaCorte.deleteMany({ where: { corte_id: parseInt(corteId) } })

        // Crear nuevos movimientos
        for (const movimiento of validatedData.movimientos) {
          const monto = movimiento.monto

          switch (movimiento.tipo) {
            case 'venta_efectivo':
              await tx.ventaCorte.create({
                data: {
                  corte_id: parseInt(corteId),
                  forma_pago: 'efectivo',
                  monto: monto,
                  cliente_id: movimiento.cliente_id || null,
                  tags: movimiento.descripcion || 'Venta en efectivo'
                }
              })
              break

            case 'cobranza':
              await tx.ingresoTurno.create({
                data: {
                  corte_id: parseInt(corteId),
                  tipo: 'cobranza',
                  monto: monto,
                  cliente_id: movimiento.cliente_id || null,
                  tags: movimiento.descripcion || 'Cobranza'
                }
              })
              break

            case 'venta_tarjeta':
              await tx.ventaCorte.create({
                data: {
                  corte_id: parseInt(corteId),
                  forma_pago: 'tarjeta',
                  monto: monto,
                  cliente_id: movimiento.cliente_id || null,
                  tags: movimiento.descripcion || 'Venta con tarjeta'
                }
              })
              break

            case 'venta_credito':
              await tx.ventaCorte.create({
                data: {
                  corte_id: parseInt(corteId),
                  forma_pago: 'credito',
                  monto: monto,
                  cliente_id: movimiento.cliente_id || null,
                  tags: movimiento.descripcion || 'Venta a crédito'
                }
              })
              break

            case 'venta_transferencia':
              await tx.ventaCorte.create({
                data: {
                  corte_id: parseInt(corteId),
                  forma_pago: 'transferencia',
                  monto: monto,
                  cliente_id: movimiento.cliente_id || null,
                  tags: movimiento.descripcion || 'Venta por transferencia'
                }
              })
              break

            case 'gasto':
            case 'compra':
              await tx.egresoTurno.create({
                data: {
                  corte_id: parseInt(corteId),
                  tipo: movimiento.tipo,
                  monto: monto,
                  categoria_id: movimiento.categoria_id || null,
                  subcategoria_id: movimiento.subcategoria_id || null,
                  relacionado_id: movimiento.relacionado_id || null,
                  descripcion: movimiento.descripcion || null,
                  tags: movimiento.descripcion || null
                }
              })
              break

            case 'cortesia':
              await tx.cortesiaCorte.create({
                data: {
                  corte_id: parseInt(corteId),
                  monto: monto,
                  beneficiario: movimiento.beneficiario || 'No especificado',
                  tags: movimiento.descripcion || 'Cortesía'
                }
              })
              break

            case 'prestamo':
              await tx.egresoTurno.create({
                data: {
                  corte_id: parseInt(corteId),
                  tipo: 'prestamo',
                  monto: monto,
                  relacionado_id: movimiento.empleado_id || null,
                  descripcion: movimiento.descripcion || null,
                  tags: movimiento.descripcion || 'Préstamo a empleado'
                }
              })
              break

            case 'retiro_parcial':
            case 'otros_retiros':
              await tx.egresoTurno.create({
                data: {
                  corte_id: parseInt(corteId),
                  tipo: movimiento.tipo,
                  monto: monto,
                  descripcion: movimiento.descripcion || null,
                  tags: movimiento.descripcion || null
                }
              })
              break
          }
        }

        // Recalcular efectivo esperado si se actualizaron movimientos
        const ingresos = validatedData.movimientos.filter(m => ['venta_efectivo', 'cobranza'].includes(m.tipo))
        const egresos = validatedData.movimientos.filter(m => [
          'retiro_parcial', 'venta_tarjeta', 'venta_transferencia',
          'gasto', 'compra', 'prestamo', 'cortesia', 'otros_retiros'
        ].includes(m.tipo))

        const ventaNetaNum = validatedData.venta_neta !== undefined ? validatedData.venta_neta : corteExistente.venta_neta
        const totalCobranza = ingresos
          .filter(m => m.tipo === 'cobranza')
          .reduce((sum, m) => sum + m.monto, 0)
        const totalEgresos = egresos
          .reduce((sum, m) => sum + m.monto, 0)

        const efectivoEsperadoNum = ventaNetaNum + totalCobranza - totalEgresos

        // Calcular efectivo real: venta en efectivo + cobranza
        const ventaEfectivo = ingresos
          .filter(m => m.tipo === 'venta_efectivo')
          .reduce((sum, m) => sum + m.monto, 0)
        const efectivoRealNum = ventaEfectivo + totalCobranza
        const diferenciaNum = efectivoRealNum - efectivoEsperadoNum

        // Actualizar el corte principal
        const corteActualizado = await tx.corteCaja.update({
          where: { id: parseInt(corteId) },
          data: {
            venta_neta: ventaNetaNum,
            efectivo_esperado: efectivoEsperadoNum,
            efectivo_real: efectivoRealNum,
            diferencia: diferenciaNum,
            tags: validatedData.tags !== undefined ? validatedData.tags : corteExistente.tags,
            adeudo_generado: diferenciaNum < -50 // Tolerancia de $50
          }
        })

        return corteActualizado
      } else {
        // Solo actualizar campos simples sin tocar movimientos
        const updateData: any = {}

        if (validatedData.venta_neta !== undefined) {
          updateData.venta_neta = validatedData.venta_neta
        }

        // El efectivo_real ya no se actualiza manualmente, se calcula automáticamente

        if (validatedData.tags !== undefined) {
          updateData.tags = validatedData.tags
        }

        // Recalcular diferencia si cambió venta_neta o efectivo_real
        if (validatedData.venta_neta !== undefined || validatedData.efectivo_real !== undefined) {
          const ventaNetaNum = validatedData.venta_neta !== undefined ? validatedData.venta_neta : corteExistente.venta_neta
          const efectivoRealNum = validatedData.efectivo_real !== undefined ? validatedData.efectivo_real : corteExistente.efectivo_real

          updateData.diferencia = efectivoRealNum - corteExistente.efectivo_esperado
          updateData.adeudo_generado = updateData.diferencia < -50
        }

        updateData.updated_at = new Date()

        return await tx.corteCaja.update({
          where: { id: parseInt(corteId) },
          data: updateData
        })
      }
    })

    // Obtener el corte completo actualizado
    const corteCompleto = await prisma.corteCaja.findUnique({
      where: { id: parseInt(corteId) },
      include: {
        empresa: {
          select: { id: true, nombre: true }
        },
        empleado: {
          select: { id: true, nombre: true, puesto: true }
        },
        ventas: true,
        cortesias: true,
        ingresos_turno: true,
        egresos_turno: {
          include: {
            categoria: { select: { nombre: true } },
            subcategoria: { select: { nombre: true } }
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Corte actualizado exitosamente',
      corte: corteCompleto
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al actualizar corte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

