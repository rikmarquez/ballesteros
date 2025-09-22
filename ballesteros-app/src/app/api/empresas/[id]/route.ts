import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para actualizar empresa
const updateEmpresaSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  activa: z.boolean().optional()
})

// GET /api/empresas/[id] - Obtener empresa por ID
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
    const empresaId = parseInt(id)
    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID de empresa inválido' },
        { status: 400 }
      )
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        _count: {
          select: {
            clientes: true,
            proveedores: true,
            cortes: true
          }
        }
      }
    })

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ empresa })
  } catch (error) {
    console.error('Error al obtener empresa:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/empresas/[id] - Actualizar empresa
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
    const empresaId = parseInt(id)
    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID de empresa inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateEmpresaSchema.parse(body)

    // Verificar que la empresa existe
    const empresaExistente = await prisma.empresa.findUnique({
      where: { id: empresaId }
    })

    if (!empresaExistente) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      )
    }

    // Si se está actualizando el nombre, verificar que no exista otra empresa con ese nombre
    if (validatedData.nombre) {
      const otraEmpresa = await prisma.empresa.findFirst({
        where: {
          nombre: validatedData.nombre,
          id: { not: empresaId }
        }
      })

      if (otraEmpresa) {
        return NextResponse.json(
          { error: 'Ya existe otra empresa con ese nombre' },
          { status: 400 }
        )
      }
    }

    const empresa = await prisma.empresa.update({
      where: { id: empresaId },
      data: validatedData
    })

    return NextResponse.json({ empresa })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al actualizar empresa:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/empresas/[id] - Desactivar empresa (soft delete)
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
    const empresaId = parseInt(id)
    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID de empresa inválido' },
        { status: 400 }
      )
    }

    // Verificar que la empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId }
    })

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      )
    }

    // Soft delete: marcar como inactiva
    const empresaDesactivada = await prisma.empresa.update({
      where: { id: empresaId },
      data: { activa: false }
    })

    return NextResponse.json({
      message: 'Empresa desactivada exitosamente',
      empresa: empresaDesactivada
    })
  } catch (error) {
    console.error('Error al desactivar empresa:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}