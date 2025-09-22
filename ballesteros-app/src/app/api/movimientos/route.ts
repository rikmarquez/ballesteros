import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema de validación para crear movimiento
const movimientoSchema = z.object({
  tipo_movimiento: z.string().min(1, "Tipo de movimiento es requerido"),
  es_ingreso: z.boolean(),
  monto: z.number().positive("Monto debe ser positivo"),
  fecha: z.string().datetime().optional(),

  // Cuentas (opcional para movimientos sin transferencia)
  cuenta_origen_id: z.number().optional(),
  cuenta_destino_id: z.number().optional(),
  fecha_aplicacion: z.string().datetime().optional(),

  // Relaciones principales
  empresa_id: z.number().optional(),
  corte_id: z.number().optional(),

  // Entidades relacionadas
  entidad_relacionada_id: z.number().optional(), // Cliente/proveedor
  empleado_responsable_id: z.number().optional(), // Quien hizo la transacción

  // Categorización
  categoria_id: z.number().optional(),
  subcategoria_id: z.number().optional(),

  // Metadatos
  forma_pago: z.enum(['efectivo', 'tarjeta', 'transferencia']).optional(),
  plataforma: z.enum(['uber_eats', 'rappi', 'didi_food']).optional(),
  referencia: z.string().optional(),
  beneficiario: z.string().optional(),
  comision: z.number().default(0)
})

// GET /api/movimientos - Listar movimientos con filtros avanzados
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Filtros disponibles
    const tipo_movimiento = searchParams.get('tipo_movimiento')
    const es_ingreso = searchParams.get('es_ingreso')
    const empresa_id = searchParams.get('empresa_id')
    const corte_id = searchParams.get('corte_id')
    const entidad_id = searchParams.get('entidad_id')
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')
    const cuenta_id = searchParams.get('cuenta_id')
    const search = searchParams.get('search')

    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir filtros WHERE
    const where: any = {}

    if (tipo_movimiento) where.tipo_movimiento = tipo_movimiento
    if (es_ingreso !== null) where.es_ingreso = es_ingreso === 'true'
    if (empresa_id) where.empresa_id = parseInt(empresa_id)
    if (corte_id) where.corte_id = parseInt(corte_id)
    if (entidad_id) {
      where.OR = [
        { entidad_relacionada_id: parseInt(entidad_id) },
        { empleado_responsable_id: parseInt(entidad_id) }
      ]
    }

    // Filtro por fechas
    if (fecha_desde || fecha_hasta) {
      where.fecha = {}
      if (fecha_desde) where.fecha.gte = new Date(fecha_desde)
      if (fecha_hasta) where.fecha.lte = new Date(fecha_hasta)
    }

    // Filtro por cuenta (origen o destino)
    if (cuenta_id) {
      const cuentaIdInt = parseInt(cuenta_id)
      where.OR = [
        { cuenta_origen_id: cuentaIdInt },
        { cuenta_destino_id: cuentaIdInt }
      ]
    }

    // Filtro por búsqueda de texto
    if (search) {
      where.OR = [
        { referencia: { contains: search, mode: 'insensitive' } },
        { beneficiario: { contains: search, mode: 'insensitive' } }
      ]
    }

    const movimientos = await prisma.movimiento.findMany({
      where,
      include: {
        empresa: {
          select: { id: true, nombre: true }
        },
        corte: {
          select: { id: true, fecha: true, sesion: true }
        },
        cuenta_origen: {
          select: { id: true, nombre: true, tipo_cuenta: true }
        },
        cuenta_destino: {
          select: { id: true, nombre: true, tipo_cuenta: true }
        },
        entidad_relacionada: {
          select: { id: true, nombre: true, es_cliente: true, es_proveedor: true }
        },
        empleado_responsable: {
          select: { id: true, nombre: true, puesto: true }
        },
        categoria: {
          select: { id: true, nombre: true, tipo: true }
        },
        subcategoria: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { fecha: 'desc' },
      take: limit,
      skip: offset
    })

    // Contar total para paginación
    const total = await prisma.movimiento.count({ where })

    return NextResponse.json({
      movimientos,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error al obtener movimientos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/movimientos - Crear nuevo movimiento
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = movimientoSchema.parse(body)

    // Validaciones adicionales
    if (validatedData.cuenta_origen_id) {
      const cuentaOrigen = await prisma.cuenta.findUnique({
        where: { id: validatedData.cuenta_origen_id }
      })
      if (!cuentaOrigen || !cuentaOrigen.activa) {
        return NextResponse.json(
          { error: 'Cuenta origen no encontrada o inactiva' },
          { status: 400 }
        )
      }
    }

    if (validatedData.cuenta_destino_id) {
      const cuentaDestino = await prisma.cuenta.findUnique({
        where: { id: validatedData.cuenta_destino_id }
      })
      if (!cuentaDestino || !cuentaDestino.activa) {
        return NextResponse.json(
          { error: 'Cuenta destino no encontrada o inactiva' },
          { status: 400 }
        )
      }
    }

    // Crear movimiento con transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear movimiento
      const nuevoMovimiento = await tx.movimiento.create({
        data: {
          tipo_movimiento: validatedData.tipo_movimiento,
          es_ingreso: validatedData.es_ingreso,
          monto: validatedData.monto,
          fecha: validatedData.fecha ? new Date(validatedData.fecha) : undefined,
          cuenta_origen_id: validatedData.cuenta_origen_id,
          cuenta_destino_id: validatedData.cuenta_destino_id,
          fecha_aplicacion: validatedData.fecha_aplicacion ? new Date(validatedData.fecha_aplicacion) : undefined,
          empresa_id: validatedData.empresa_id,
          corte_id: validatedData.corte_id,
          entidad_relacionada_id: validatedData.entidad_relacionada_id,
          empleado_responsable_id: validatedData.empleado_responsable_id,
          categoria_id: validatedData.categoria_id,
          subcategoria_id: validatedData.subcategoria_id,
          forma_pago: validatedData.forma_pago,
          plataforma: validatedData.plataforma,
          referencia: validatedData.referencia,
          beneficiario: validatedData.beneficiario,
          comision: validatedData.comision
        },
        include: {
          empresa: true,
          corte: true,
          cuenta_origen: true,
          cuenta_destino: true,
          entidad_relacionada: true,
          empleado_responsable: true,
          categoria: true,
          subcategoria: true
        }
      })

      // Actualizar saldos de cuentas si aplica
      if (validatedData.cuenta_origen_id) {
        await tx.cuenta.update({
          where: { id: validatedData.cuenta_origen_id },
          data: {
            saldo_actual: {
              decrement: validatedData.monto
            }
          }
        })
      }

      if (validatedData.cuenta_destino_id) {
        await tx.cuenta.update({
          where: { id: validatedData.cuenta_destino_id },
          data: {
            saldo_actual: {
              increment: validatedData.monto
            }
          }
        })
      }

      // Actualizar campos del corte si está asociado
      if (validatedData.corte_id) {
        const campoCorte = getCampoCorte(validatedData.tipo_movimiento)
        if (campoCorte) {
          await tx.corte.update({
            where: { id: validatedData.corte_id },
            data: {
              [campoCorte]: {
                increment: validatedData.monto
              }
            }
          })
        }
      }

      return nuevoMovimiento
    })

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear movimiento:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función helper para mapear tipo de movimiento a campo de corte
function getCampoCorte(tipoMovimiento: string): string | null {
  const mapeoTipos: Record<string, string> = {
    'venta_efectivo': 'venta_efectivo',
    'venta_credito': 'venta_credito',
    'venta_tarjeta': 'venta_tarjeta',
    'venta_transferencia': 'venta_transferencia',
    'venta_plataforma': 'venta_plataforma',
    'cobranza': 'cobranza',
    'retiro_parcial': 'retiro_parcial',
    'gasto': 'gasto',
    'compra': 'compra',
    'prestamo': 'prestamo',
    'cortesia': 'cortesia',
    'otros_retiros': 'otros_retiros'
  }

  return mapeoTipos[tipoMovimiento] || null
}