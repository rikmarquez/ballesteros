import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para crear empleado
const createEmpleadoSchema = z.object({
  nombre: z.string().min(1).max(255),
  telefono: z.string().max(20).optional(),
  puesto: z.string().max(100).optional(),
  puede_operar_caja: z.boolean().optional().default(false),
  activo: z.boolean().optional().default(true)
})

// GET /api/empleados - Listar empleados
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activo = searchParams.get('activo')
    const puede_operar_caja = searchParams.get('puede_operar_caja')

    const where: any = {}
    if (activo !== null) where.activo = activo === 'true'
    if (puede_operar_caja !== null) where.puede_operar_caja = puede_operar_caja === 'true'

    const empleados = await prisma.empleado.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: {
            cortes: true,
            prestamos: true
          }
        }
      }
    })

    return NextResponse.json({ empleados })
  } catch (error) {
    console.error('Error al listar empleados:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/empleados - Crear nuevo empleado
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createEmpleadoSchema.parse(body)

    // Verificar que no exista un empleado con el mismo nombre
    const empleadoExistente = await prisma.empleado.findFirst({
      where: { nombre: validatedData.nombre }
    })

    if (empleadoExistente) {
      return NextResponse.json(
        { error: 'Ya existe un empleado con ese nombre' },
        { status: 400 }
      )
    }

    const empleado = await prisma.empleado.create({
      data: validatedData
    })

    return NextResponse.json({ empleado }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear empleado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}