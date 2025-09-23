import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para crear proveedor
const createProveedorSchema = z.object({
  nombre: z.string().min(1).max(255),
  telefono: z.string().max(20).optional().nullable(),
  activo: z.boolean().optional().default(true)
})

// GET /api/proveedores - Listar proveedores (usando tabla entidades)
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
      es_proveedor: true // Solo entidades que son proveedores
    }

    if (activo !== null) where.activo = activo === 'true'

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } }
      ]
    }

    const proveedores = await prisma.entidad.findMany({
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
    const proveedoresFormateados = proveedores.map(prov => ({
      id: prov.id,
      nombre: prov.nombre,
      telefono: prov.telefono,
      activo: prov.activo,
      created_at: prov.created_at,
      empresas: prov.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa.id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion
      })),
      contadores: {
        movimientos_como_proveedor: prov._count.movimientos_entidad
      }
    }))

    return NextResponse.json({ proveedores: proveedoresFormateados })
  } catch (error) {
    console.error('Error al listar proveedores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/proveedores - Crear nuevo proveedor (usando tabla entidades)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createProveedorSchema.parse(body)

    // Verificar que no exista un proveedor con el mismo nombre
    const proveedorExistente = await prisma.entidad.findFirst({
      where: {
        nombre: validatedData.nombre,
        es_proveedor: true,
        activo: true
      }
    })

    if (proveedorExistente) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese nombre' },
        { status: 400 }
      )
    }

    // Usar transacción para crear proveedor y asignarlo a todas las empresas activas
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear proveedor como entidad
      const proveedor = await tx.entidad.create({
        data: {
          nombre: validatedData.nombre,
          telefono: validatedData.telefono,
          activo: validatedData.activo,
          es_empleado: false,
          es_cliente: false,
          es_proveedor: true
        }
      })

      // Obtener todas las empresas activas y asignar el proveedor a todas
      const empresasActivas = await tx.empresa.findMany({
        where: { activa: true },
        select: { id: true }
      })

      // Crear relaciones con TODAS las empresas activas
      if (empresasActivas.length > 0) {
        await tx.entidadEmpresa.createMany({
          data: empresasActivas.map(empresa => ({
            entidad_id: proveedor.id,
            empresa_id: empresa.id,
            tipo_relacion: 'proveedor',
            activo: true
          }))
        })
      }

      return proveedor
    })

    // Obtener proveedor completo con empresas para respuesta
    const proveedorCompleto = await prisma.entidad.findUnique({
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
    const proveedorFormateado = {
      id: resultado.id,
      nombre: resultado.nombre,
      telefono: resultado.telefono,
      activo: resultado.activo,
      created_at: resultado.created_at,
      empresas: proveedorCompleto?.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa.id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion
      })) || []
    }

    return NextResponse.json({ proveedor: proveedorFormateado }, { status: 201 })
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