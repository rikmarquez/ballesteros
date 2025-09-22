import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para actualizar subcategoría
const updateSubcategoriaSchema = z.object({
  categoria_id: z.number().int().positive().optional(),
  nombre: z.string().min(1).max(100).optional()
})

// GET /api/subcategorias/[id] - Obtener subcategoría por ID
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
    const subcategoriaId = parseInt(id)
    if (isNaN(subcategoriaId)) {
      return NextResponse.json(
        { error: 'ID de subcategoría inválido' },
        { status: 400 }
      )
    }

    const subcategoria = await prisma.subcategoriaGasto.findUnique({
      where: { id: subcategoriaId },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            activa: true
          }
        },
        _count: {
          select: {
            egresos_turno: true,
            cuentas_pagar: true
          }
        }
      }
    })

    if (!subcategoria) {
      return NextResponse.json(
        { error: 'Subcategoría no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ subcategoria })
  } catch (error) {
    console.error('Error al obtener subcategoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/subcategorias/[id] - Actualizar subcategoría
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
    const subcategoriaId = parseInt(id)
    if (isNaN(subcategoriaId)) {
      return NextResponse.json(
        { error: 'ID de subcategoría inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateSubcategoriaSchema.parse(body)

    // Verificar que la subcategoría existe
    const subcategoriaExistente = await prisma.subcategoriaGasto.findUnique({
      where: { id: subcategoriaId }
    })

    if (!subcategoriaExistente) {
      return NextResponse.json(
        { error: 'Subcategoría no encontrada' },
        { status: 404 }
      )
    }

    // Si se está cambiando la categoría, verificar que existe y está activa
    if (validatedData.categoria_id) {
      const categoria = await prisma.categoriaGasto.findUnique({
        where: { id: validatedData.categoria_id }
      })

      if (!categoria || !categoria.activa) {
        return NextResponse.json(
          { error: 'Nueva categoría no encontrada o inactiva' },
          { status: 400 }
        )
      }
    }

    // Si se está actualizando el nombre o categoría, verificar unicidad
    if (validatedData.nombre || validatedData.categoria_id) {
      const categoria_id = validatedData.categoria_id || subcategoriaExistente.categoria_id
      const nombre = validatedData.nombre || subcategoriaExistente.nombre

      const otraSubcategoria = await prisma.subcategoriaGasto.findFirst({
        where: {
          categoria_id: categoria_id,
          nombre: nombre,
          id: { not: subcategoriaId }
        }
      })

      if (otraSubcategoria) {
        return NextResponse.json(
          { error: 'Ya existe otra subcategoría con ese nombre en esa categoría' },
          { status: 400 }
        )
      }
    }

    const subcategoria = await prisma.subcategoriaGasto.update({
      where: { id: subcategoriaId },
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

    return NextResponse.json({ subcategoria })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al actualizar subcategoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/subcategorias/[id] - Eliminar subcategoría
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
    const subcategoriaId = parseInt(id)
    if (isNaN(subcategoriaId)) {
      return NextResponse.json(
        { error: 'ID de subcategoría inválido' },
        { status: 400 }
      )
    }

    // Verificar que la subcategoría existe
    const subcategoria = await prisma.subcategoriaGasto.findUnique({
      where: { id: subcategoriaId },
      include: {
        _count: {
          select: {
            egresos_turno: true,
            cuentas_pagar: true
          }
        }
      }
    })

    if (!subcategoria) {
      return NextResponse.json(
        { error: 'Subcategoría no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que no tenga registros asociados
    if (subcategoria._count.egresos_turno > 0 || subcategoria._count.cuentas_pagar > 0) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar subcategoría con registros asociados',
          egresos: subcategoria._count.egresos_turno,
          cuentas_pagar: subcategoria._count.cuentas_pagar
        },
        { status: 400 }
      )
    }

    // Eliminar subcategoría (hard delete ya que no tiene campo "activa")
    await prisma.subcategoriaGasto.delete({
      where: { id: subcategoriaId }
    })

    return NextResponse.json({
      message: 'Subcategoría eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error al eliminar subcategoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}