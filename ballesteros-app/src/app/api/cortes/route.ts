import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { crearCorteSchema, filtrosCorteSchema, calcularCamposCorte } from '@/lib/validations/cortes'
import { z } from 'zod'

// GET /api/cortes - Listar cortes con filtros (NUEVO FLUJO)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Obtener parámetros directamente sin validación Zod para filtros
    const empresa_id = searchParams.get('empresa_id')
    const entidad_id = searchParams.get('entidad_id')
    const fecha = searchParams.get('fecha')
    const estado = searchParams.get('estado')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    if (empresa_id && empresa_id !== 'all') {
      const empresaIdNum = parseInt(empresa_id)
      if (!isNaN(empresaIdNum)) {
        where.empresa_id = empresaIdNum
      }
    }

    if (entidad_id && entidad_id !== 'all') {
      const entidadIdNum = parseInt(entidad_id)
      if (!isNaN(entidadIdNum)) {
        where.entidad_id = entidadIdNum
      }
    }

    if (fecha) {
      where.fecha = new Date(fecha)
    }

    if (estado && estado !== 'all') {
      where.estado = estado
    }

    const cortes = await prisma.corte.findMany({
      where,
      include: {
        empresa: {
          select: { id: true, nombre: true }
        },
        empleado: {
          select: { id: true, nombre: true, puesto: true }
        }
      },
      orderBy: [
        { fecha: 'desc' },
        { created_at: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    const total = await prisma.corte.count({ where })

    return NextResponse.json({
      cortes,
      pagination: {
        total,
        limit: limit,
        offset: offset,
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

// POST /api/cortes - Crear nuevo corte con flujo simplificado (SOLO TOTALES)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Datos recibidos en POST /api/cortes:', JSON.stringify(body, null, 2))

    // Validar datos con el nuevo esquema
    let validatedData
    try {
      validatedData = crearCorteSchema.parse({
        ...body,
        empresa_id: body.empresa_id?.toString(),
        entidad_id: body.entidad_id?.toString(),
      })
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

    // Verificar si ya existe un corte para la misma empresa, entidad, fecha y sesión
    const existingCorte = await prisma.corte.findUnique({
      where: {
        empresa_id_entidad_id_fecha_sesion: {
          empresa_id: parseInt(validatedData.empresa_id),
          entidad_id: parseInt(validatedData.entidad_id),
          fecha: new Date(validatedData.fecha),
          sesion: validatedData.sesion
        }
      }
    })

    if (existingCorte) {
      return NextResponse.json(
        { error: 'Ya existe un corte para esta empresa, empleado, fecha y sesión' },
        { status: 400 }
      )
    }

    // Calcular campos automáticamente
    const camposCalculados = calcularCamposCorte(validatedData)

    // Crear el corte con cálculos automáticos
    const nuevoCorte = await prisma.corte.create({
      data: {
        empresa_id: parseInt(validatedData.empresa_id),
        entidad_id: parseInt(validatedData.entidad_id),
        fecha: new Date(validatedData.fecha),
        sesion: validatedData.sesion,

        // CAPTURA MANUAL
        venta_neta: validatedData.venta_neta,

        // INGRESOS
        venta_efectivo: validatedData.venta_efectivo,
        venta_credito: validatedData.venta_credito,
        venta_plataforma: validatedData.venta_plataforma,
        cobranza: validatedData.cobranza,

        // EGRESOS
        venta_credito_tarjeta: validatedData.venta_credito_tarjeta,
        venta_debito_tarjeta: validatedData.venta_debito_tarjeta,
        venta_transferencia: validatedData.venta_transferencia,
        retiro_parcial: validatedData.retiro_parcial,
        gasto: validatedData.gasto,
        compra: validatedData.compra,
        prestamo: validatedData.prestamo,
        cortesia: validatedData.cortesia,
        otros_retiros: validatedData.otros_retiros,

        // CÁLCULOS AUTOMÁTICOS
        venta_tarjeta: camposCalculados.venta_tarjeta,
        total_ingresos: camposCalculados.total_ingresos,
        total_egresos: camposCalculados.total_egresos,
        efectivo_esperado: camposCalculados.efectivo_esperado,
        diferencia: camposCalculados.diferencia,
        adeudo_generado: camposCalculados.adeudo_generado,

        estado: 'activo'
      },
      include: {
        empresa: {
          select: { id: true, nombre: true }
        },
        empleado: {
          select: { id: true, nombre: true, puesto: true }
        }
      }
    })

    console.log('Corte creado exitosamente:', nuevoCorte.id)

    return NextResponse.json({
      message: 'Corte creado exitosamente',
      corte: nuevoCorte
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear corte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}