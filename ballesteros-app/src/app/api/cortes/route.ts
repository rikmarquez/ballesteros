import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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

    if (empresa_id) {
      where.empresa_id = parseInt(empresa_id)
    }

    if (empleado_id) {
      where.empleado_id = parseInt(empleado_id)
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

// POST /api/cortes - Crear nuevo corte
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
      tags
    } = body

    // Validación básica
    if (!empresa_id || !empleado_id || !fecha || !venta_neta) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
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

    // Calcular efectivo esperado (lógica básica)
    const ventaNetaNum = parseFloat(venta_neta)
    const efectivoEsperado = await calcularEfectivoEsperado(
      parseInt(empresa_id),
      parseInt(empleado_id),
      new Date(fecha),
      ventaNetaNum
    )

    // Calcular diferencia
    const efectivoRealNum = efectivo_real ? parseFloat(efectivo_real) : 0
    const diferencia = efectivoRealNum - efectivoEsperado

    // Determinar si se genera adeudo (faltante mayor a tolerancia)
    const tolerancia = 50 // $50 pesos de tolerancia
    const adeudoGenerado = diferencia < -tolerancia

    const nuevoCorte = await prisma.corteCaja.create({
      data: {
        empresa_id: parseInt(empresa_id),
        empleado_id: parseInt(empleado_id),
        fecha: new Date(fecha),
        sesion: parseInt(sesion) || 1,
        venta_neta: ventaNetaNum,
        efectivo_esperado: efectivoEsperado,
        efectivo_real: efectivoRealNum || null,
        diferencia: efectivo_real ? diferencia : null,
        tags: tags || null,
        adeudo_generado: adeudoGenerado
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

    // Si hay adeudo, crear registro en préstamos de empleado
    if (adeudoGenerado && efectivo_real) {
      await prisma.prestamoEmpleado.create({
        data: {
          empleado_id: parseInt(empleado_id),
          tipo: 'adeudo_faltante',
          fecha: new Date(fecha),
          monto: Math.abs(diferencia),
          origen: 'corte_caja',
          corte_id: nuevoCorte.id,
          referencia: `Adeudo por faltante en corte ${nuevoCorte.id}`
        }
      })
    }

    return NextResponse.json(nuevoCorte, { status: 201 })

  } catch (error) {
    console.error('Error al crear corte:', error)
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
    // TODO: Implementar lógica completa basada en:
    // 1. Venta neta (base)
    // 2. Menos ingresos no efectivo (tarjetas, transferencias, créditos)
    // 3. Más ingresos en efectivo (cobranzas)
    // 4. Menos egresos en efectivo (gastos, compras, retiros)

    // Por ahora, lógica simplificada: 85% de la venta neta es efectivo
    const porcentajeEfectivo = 0.85
    return venta_neta * porcentajeEfectivo

  } catch (error) {
    console.error('Error al calcular efectivo esperado:', error)
    // Fallback: 85% de venta neta
    return venta_neta * 0.85
  }
}