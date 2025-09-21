import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para crear proveedor
const createProveedorSchema = z.object({
  empresa_id: z.number().int().positive(),
  nombre: z.string().min(1).max(255)
})

// GET /api/proveedores - Listar proveedores
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
      where.nombre = { contains: search, mode: 'insensitive' }
    }

    const proveedores = await prisma.proveedor.findMany({
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
            cuentas_pagar: true,
            pagos: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({ proveedores })
  } catch (error) {
    console.error('Error al listar proveedores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/proveedores - Crear nuevo proveedor
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createProveedorSchema.parse(body)

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

    // Verificar que no exista un proveedor con el mismo nombre en la misma empresa
    const proveedorExistente = await prisma.proveedor.findFirst({
      where: {
        empresa_id: validatedData.empresa_id,
        nombre: validatedData.nombre
      }
    })

    if (proveedorExistente) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese nombre en esta empresa' },
        { status: 400 }
      )
    }

    const proveedor = await prisma.proveedor.create({
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

    return NextResponse.json({ proveedor }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear proveedor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}