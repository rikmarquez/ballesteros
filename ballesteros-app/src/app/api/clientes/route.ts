import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para crear cliente
const createClienteSchema = z.object({
  nombre: z.string().min(1).max(255),
  telefono: z.string().max(20).optional().nullable(),
  activo: z.boolean().optional().default(true)
})

// GET /api/clientes - Listar clientes (usando tabla entidades)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activo = searchParams.get('activo')
    const search = searchParams.get('search')

    const where: any = {
      es_cliente: true // Solo entidades que son clientes
    }

    if (activo !== null) where.activo = activo === 'true'

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } }
      ]
    }

    const clientes = await prisma.entidad.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: {
        entidades_empresas: {
          include: {
            empresa: {
              select: { id: true, nombre: true }
            }
          }
        },
        _count: {
          select: {
            movimientos_entidad: true
          }
        }
      }
    })

    // Formatear respuesta para compatibilidad con frontend existente
    const clientesFormateados = clientes.map(cliente => ({
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      activo: cliente.activo,
      created_at: cliente.created_at,
      empresas: cliente.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa.id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion
      })),
      contadores: {
        movimientos_como_cliente: cliente._count.movimientos_entidad
      }
    }))

    return NextResponse.json({ clientes: clientesFormateados })
  } catch (error) {
    console.error('Error al listar clientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/clientes - Crear nuevo cliente (usando tabla entidades)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createClienteSchema.parse(body)

    // Verificar que no exista un cliente con el mismo nombre
    const clienteExistente = await prisma.entidad.findFirst({
      where: {
        nombre: validatedData.nombre,
        es_cliente: true,
        activo: true
      }
    })

    if (clienteExistente) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con ese nombre' },
        { status: 400 }
      )
    }

    // Usar transacción para crear cliente y asignarlo a todas las empresas activas
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear cliente como entidad
      const cliente = await tx.entidad.create({
        data: {
          nombre: validatedData.nombre,
          telefono: validatedData.telefono,
          activo: validatedData.activo,
          es_empleado: false,
          es_cliente: true,
          es_proveedor: false
        }
      })

      // Obtener todas las empresas activas y asignar el cliente a todas
      const empresasActivas = await tx.empresa.findMany({
        where: { activa: true },
        select: { id: true }
      })

      // Crear relaciones con TODAS las empresas activas
      if (empresasActivas.length > 0) {
        await tx.entidadEmpresa.createMany({
          data: empresasActivas.map(empresa => ({
            entidad_id: cliente.id,
            empresa_id: empresa.id,
            tipo_relacion: 'cliente',
            activo: true
          }))
        })
      }

      return cliente
    })

    // Obtener cliente completo con empresas para respuesta
    const clienteCompleto = await prisma.entidad.findUnique({
      where: { id: resultado.id },
      include: {
        entidades_empresas: {
          include: {
            empresa: {
              select: { id: true, nombre: true }
            }
          }
        }
      }
    })

    // Formatear respuesta para compatibilidad
    const clienteFormateado = {
      id: resultado.id,
      nombre: resultado.nombre,
      telefono: resultado.telefono,
      activo: resultado.activo,
      created_at: resultado.created_at,
      empresas: clienteCompleto?.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa.id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion
      })) || []
    }

    return NextResponse.json({ cliente: clienteFormateado }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear cliente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}