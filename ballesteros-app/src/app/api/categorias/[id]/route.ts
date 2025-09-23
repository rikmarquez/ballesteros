import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para actualizar categoría
const updateCategoriaSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  tipo: z.enum(['compra', 'servicio', 'mantenimiento', 'personal', 'otros']).optional(),
  activa: z.boolean().optional()
})

// GET /api/categorias/[id] - Obtener categoría por ID
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
    const categoriaId = parseInt(id)
    if (isNaN(categoriaId)) {
      return NextResponse.json(
        { error: 'ID de categoría inválido' },
        { status: 400 }
      )
    }

    const categoria = await prisma.categoriaGasto.findUnique({
      where: { id: categoriaId },
      include: {
        subcategorias: {
          orderBy: { nombre: 'asc' }
        },
        _count: {
          select: {
            subcategorias: true,
            movimientos: true
          }
        }
      }
    })

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ categoria })
  } catch (error) {
    console.error('Error al obtener categoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/categorias/[id] - Actualizar categoría
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
    const categoriaId = parseInt(id)
    if (isNaN(categoriaId)) {
      return NextResponse.json(
        { error: 'ID de categoría inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateCategoriaSchema.parse(body)

    // Verificar que la categoría existe
    const categoriaExistente = await prisma.categoriaGasto.findUnique({
      where: { id: categoriaId }
    })

    if (!categoriaExistente) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    // Si se está actualizando el nombre, verificar que no exista otra categoría con ese nombre
    if (validatedData.nombre) {
      const otraCategoria = await prisma.categoriaGasto.findFirst({
        where: {
          nombre: validatedData.nombre,
          id: { not: categoriaId }
        }
      })

      if (otraCategoria) {
        return NextResponse.json(
          { error: 'Ya existe otra categoría con ese nombre' },
          { status: 400 }
        )
      }
    }

    const categoria = await prisma.categoriaGasto.update({
      where: { id: categoriaId },
      data: validatedData
    })

    return NextResponse.json({ categoria })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al actualizar categoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/categorias/[id] - Desactivar categoría (soft delete)
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
    const categoriaId = parseInt(id)
    if (isNaN(categoriaId)) {
      return NextResponse.json(
        { error: 'ID de categoría inválido' },
        { status: 400 }
      )
    }

    // Verificar que la categoría existe
    const categoria = await prisma.categoriaGasto.findUnique({
      where: { id: categoriaId }
    })

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que no tenga movimientos asociados
    const usosActivos = await prisma.categoriaGasto.findUnique({
      where: { id: categoriaId },
      include: {
        _count: {
          select: {
            movimientos: true,
            subcategorias: true
          }
        }
      }
    })

    if (usosActivos && usosActivos._count.movimientos > 0) {
      return NextResponse.json(
        {
          error: 'No se puede desactivar categoría con movimientos asociados',
          movimientos: usosActivos._count.movimientos
        },
        { status: 400 }
      )
    }

    // Soft delete: marcar como inactiva
    const categoriaDesactivada = await prisma.categoriaGasto.update({
      where: { id: categoriaId },
      data: { activa: false }
    })

    return NextResponse.json({
      message: 'Categoría desactivada exitosamente',
      categoria: categoriaDesactivada
    })
  } catch (error) {
    console.error('Error al desactivar categoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}