import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para crear cliente
const createClienteSchema = z.object({
  empresa_id: z.number().int().positive(),
  nombre: z.string().min(1).max(255),
  telefono: z.string().max(20).optional(),
  saldo_inicial: z.number().default(0).transform(val => Number(val.toFixed(2)))
})

// GET /api/clientes - Listar clientes
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const empresa_id = searchParams.get('empresa_id')
    const search = searchParams.get('search')

    const where: any = {}
    if (empresa_id) where.empresa_id = parseInt(empresa_id)
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search } }
      ]
    }

    const clientes = await prisma.cliente.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true
          }
        },
        _count: {
          select: {
            movimientos: true,
            ventas_credito: true,
            ingresos_turno: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({ clientes })
  } catch (error) {
    console.error('Error al listar clientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/clientes - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createClienteSchema.parse(body)

    // Verificar que la empresa existe y está activa
    const empresa = await prisma.empresa.findUnique({
      where: { id: validatedData.empresa_id }
    })

    if (!empresa || !empresa.activa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada o inactiva' },
        { status: 400 }
      )
    }

    // Verificar que no exista un cliente con el mismo nombre en la misma empresa
    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        empresa_id: validatedData.empresa_id,
        nombre: validatedData.nombre
      }
    })

    if (clienteExistente) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con ese nombre en esta empresa' },
        { status: 400 }
      )
    }

    const cliente = await prisma.cliente.create({
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

    return NextResponse.json({ cliente }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear cliente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}