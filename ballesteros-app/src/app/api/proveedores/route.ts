import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para crear proveedor
const createProveedorSchema = z.object({
  empresa_id: z.number().int().positive(),
  nombre: z.string().min(1).max(255),
  telefono: z.string().max(20).optional()
})

// GET /api/proveedores - Listar proveedores (usando tabla entidades)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const empresa_id = searchParams.get('empresa_id')
    const search = searchParams.get('search')

    const where: any = {
      es_proveedor: true // Solo entidades que son proveedores
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Construir query con filtro de empresa si se especifica
    let proveedoresQuery: any = {
      where,
      include: {
        entidades_empresas: {
          where: {
            tipo_relacion: 'proveedor',
            activo: true,
            ...(empresa_id && { empresa_id: parseInt(empresa_id) })
          },
          include: {
            empresa: {
              select: { id: true, nombre: true }
            }
          }
        },
        _count: {
          select: {
            movimientos_entidad: true,
            saldos: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    }

    // Si filtran por empresa, añadir filtro en WHERE
    if (empresa_id) {
      where.entidades_empresas = {
        some: {
          empresa_id: parseInt(empresa_id),
          tipo_relacion: 'proveedor',
          activo: true
        }
      }
    }

    const proveedores = await prisma.entidad.findMany(proveedoresQuery)

    // Formatear respuesta para compatibilidad
    const proveedoresFormateados = proveedores.map(proveedor => ({
      id: proveedor.id,
      nombre: proveedor.nombre,
      telefono: proveedor.telefono,
      activo: proveedor.activo,
      created_at: proveedor.created_at,
      empresas: proveedor.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa_id,
        empresa_nombre: rel.empresa.nombre,
        activo: rel.activo
      })),
      _count: {
        cuentas_pagar: proveedor._count.saldos, // Aproximación
        pagos: proveedor._count.movimientos_entidad
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

    // Crear proveedor en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear entidad proveedor
      const nuevoProveedor = await tx.entidad.create({
        data: {
          nombre: validatedData.nombre,
          telefono: validatedData.telefono,
          es_proveedor: true,
          es_empleado: false,
          es_cliente: false,
          activo: true
        }
      })

      // Crear relación empresa-proveedor
      await tx.entidadEmpresa.create({
        data: {
          entidad_id: nuevoProveedor.id,
          empresa_id: validatedData.empresa_id,
          tipo_relacion: 'proveedor',
          activo: true
        }
      })

      return nuevoProveedor
    })

    // Obtener proveedor completo para respuesta
    const proveedorCompleto = await prisma.entidad.findUnique({
      where: { id: result.id },
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
      id: proveedorCompleto!.id,
      nombre: proveedorCompleto!.nombre,
      telefono: proveedorCompleto!.telefono,
      activo: proveedorCompleto!.activo,
      created_at: proveedorCompleto!.created_at,
      empresa: proveedorCompleto!.entidades_empresas[0]?.empresa
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