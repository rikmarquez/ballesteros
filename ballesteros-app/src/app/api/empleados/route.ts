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

// GET /api/empleados - Listar empleados (usando tabla entidades)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activo = searchParams.get('activo')
    const puede_operar_caja = searchParams.get('puede_operar_caja')
    const search = searchParams.get('search')

    const where: any = {
      es_empleado: true // Solo entidades que son empleados
    }

    if (activo !== null) where.activo = activo === 'true'
    if (puede_operar_caja !== null) where.puede_operar_caja = puede_operar_caja === 'true'

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } },
        { puesto: { contains: search, mode: 'insensitive' } }
      ]
    }

    const empleados = await prisma.entidad.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: {
            movimientos_empleado: true,
            cortes: true
          }
        }
      }
    })

    // Formatear respuesta para compatibilidad con frontend existente
    const empleadosFormateados = empleados.map(emp => ({
      id: emp.id,
      nombre: emp.nombre,
      telefono: emp.telefono,
      puesto: emp.puesto,
      puede_operar_caja: emp.puede_operar_caja,
      activo: emp.activo,
      created_at: emp.created_at,
      _count: {
        cortes: emp._count.cortes,
        prestamos: emp._count.movimientos_empleado // Aproximación
      }
    }))

    return NextResponse.json({ empleados: empleadosFormateados })
  } catch (error) {
    console.error('Error al listar empleados:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/empleados - Crear nuevo empleado (usando tabla entidades)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createEmpleadoSchema.parse(body)

    // Verificar que no exista un empleado con el mismo nombre
    const empleadoExistente = await prisma.entidad.findFirst({
      where: {
        nombre: validatedData.nombre,
        es_empleado: true,
        activo: true
      }
    })

    if (empleadoExistente) {
      return NextResponse.json(
        { error: 'Ya existe un empleado con ese nombre' },
        { status: 400 }
      )
    }

    // Crear empleado como entidad
    const empleado = await prisma.entidad.create({
      data: {
        nombre: validatedData.nombre,
        telefono: validatedData.telefono,
        puesto: validatedData.puesto,
        puede_operar_caja: validatedData.puede_operar_caja,
        activo: validatedData.activo,
        es_empleado: true,
        es_cliente: false,
        es_proveedor: false
      }
    })

    // Formatear respuesta para compatibilidad
    const empleadoFormateado = {
      id: empleado.id,
      nombre: empleado.nombre,
      telefono: empleado.telefono,
      puesto: empleado.puesto,
      puede_operar_caja: empleado.puede_operar_caja,
      activo: empleado.activo,
      created_at: empleado.created_at
    }

    return NextResponse.json({ empleado: empleadoFormateado }, { status: 201 })
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