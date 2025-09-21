import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para crear empresa
const createEmpresaSchema = z.object({
  nombre: z.string().min(1).max(100),
  activa: z.boolean().optional().default(true)
})

// Esquema de validación para actualizar empresa
const updateEmpresaSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  activa: z.boolean().optional()
})

// GET /api/empresas - Listar empresas
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activa = searchParams.get('activa')

    const empresas = await prisma.empresa.findMany({
      where: activa !== null ? { activa: activa === 'true' } : undefined,
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({ empresas })
  } catch (error) {
    console.error('Error al listar empresas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/empresas - Crear nueva empresa
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createEmpresaSchema.parse(body)

    // Verificar que no exista una empresa con el mismo nombre
    const empresaExistente = await prisma.empresa.findFirst({
      where: { nombre: validatedData.nombre }
    })

    if (empresaExistente) {
      return NextResponse.json(
        { error: 'Ya existe una empresa con ese nombre' },
        { status: 400 }
      )
    }

    const empresa = await prisma.empresa.create({
      data: validatedData
    })

    return NextResponse.json({ empresa }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear empresa:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}