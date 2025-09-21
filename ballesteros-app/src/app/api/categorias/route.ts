import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para crear categoría
const createCategoriaSchema = z.object({
  nombre: z.string().min(1).max(100),
  tipo: z.enum(['compra', 'servicio', 'mantenimiento', 'personal', 'otros']).optional(),
  activa: z.boolean().optional().default(true)
})

// GET /api/categorias - Listar categorías de gasto
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activa = searchParams.get('activa')
    const tipo = searchParams.get('tipo')
    const incluir_subcategorias = searchParams.get('incluir_subcategorias')

    const where: any = {}
    if (activa !== null) where.activa = activa === 'true'
    if (tipo) where.tipo = tipo

    const categorias = await prisma.categoriaGasto.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        subcategorias: incluir_subcategorias === 'true' ? {
          orderBy: { nombre: 'asc' }
        } : false,
        _count: {
          select: {
            subcategorias: true,
            egresos_turno: true,
            cuentas_pagar: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({ categorias })
  } catch (error) {
    console.error('Error al listar categorías:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/categorias - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCategoriaSchema.parse(body)

    // Verificar que no exista una categoría con el mismo nombre
    const categoriaExistente = await prisma.categoriaGasto.findFirst({
      where: { nombre: validatedData.nombre }
    })

    if (categoriaExistente) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      )
    }

    const categoria = await prisma.categoriaGasto.create({
      data: validatedData
    })

    return NextResponse.json({ categoria }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}