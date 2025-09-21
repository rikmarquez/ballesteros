import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para crear subcategoría
const createSubcategoriaSchema = z.object({
  categoria_id: z.number().int().positive(),
  nombre: z.string().min(1).max(100)
})

// GET /api/subcategorias - Listar subcategorías
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoria_id = searchParams.get('categoria_id')

    const where = categoria_id ? { categoria_id: parseInt(categoria_id) } : undefined

    const subcategorias = await prisma.subcategoriaGasto.findMany({
      where,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
            tipo: true
          }
        },
        _count: {
          select: {
            egresos_turno: true,
            cuentas_pagar: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({ subcategorias })
  } catch (error) {
    console.error('Error al listar subcategorías:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/subcategorias - Crear nueva subcategoría
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSubcategoriaSchema.parse(body)

    // Verificar que la categoría padre existe y está activa
    const categoria = await prisma.categoriaGasto.findUnique({
      where: { id: validatedData.categoria_id }
    })

    if (!categoria || !categoria.activa) {
      return NextResponse.json(
        { error: 'Categoría no encontrada o inactiva' },
        { status: 400 }
      )
    }

    // Verificar que no exista una subcategoría con el mismo nombre en la misma categoría
    const subcategoriaExistente = await prisma.subcategoriaGasto.findFirst({
      where: {
        categoria_id: validatedData.categoria_id,
        nombre: validatedData.nombre
      }
    })

    if (subcategoriaExistente) {
      return NextResponse.json(
        { error: 'Ya existe una subcategoría con ese nombre en esta categoría' },
        { status: 400 }
      )
    }

    const subcategoria = await prisma.subcategoriaGasto.create({
      data: validatedData,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
            tipo: true
          }
        }
      }
    })

    return NextResponse.json({ subcategoria }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear subcategoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}