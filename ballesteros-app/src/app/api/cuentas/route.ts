import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth'

const prisma = new PrismaClient()

// GET /api/cuentas - Listar cuentas con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Filtros disponibles
    const activa = searchParams.get('activa')
    const empresa_id = searchParams.get('empresa_id')
    const tipo_cuenta = searchParams.get('tipo_cuenta')
    const search = searchParams.get('search')

    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir filtros WHERE
    const where: any = {}

    if (activa !== null) where.activa = activa === 'true'
    if (tipo_cuenta) where.tipo_cuenta = tipo_cuenta

    // Filtro por búsqueda de texto
    if (search) {
      where.nombre = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const cuentas = await prisma.cuenta.findMany({
      where,
      orderBy: [
        { tipo_cuenta: 'asc' },
        { nombre: 'asc' }
      ],
      take: limit,
      skip: offset
    })

    // Contar total para paginación
    const total = await prisma.cuenta.count({ where })

    return NextResponse.json({
      cuentas,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error al obtener cuentas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}