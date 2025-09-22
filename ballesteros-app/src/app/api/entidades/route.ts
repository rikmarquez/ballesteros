import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema de validación para crear/actualizar entidades
const entidadSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  telefono: z.string().optional(),
  es_cliente: z.boolean().default(false),
  es_proveedor: z.boolean().default(false),
  es_empleado: z.boolean().default(false),
  puesto: z.string().optional(),
  puede_operar_caja: z.boolean().default(false),
  activo: z.boolean().default(true),
  empresas: z.array(z.object({
    empresa_id: z.number(),
    tipo_relacion: z.enum(['cliente', 'proveedor'])
  })).optional()
}).refine(data => data.es_cliente || data.es_proveedor || data.es_empleado, {
  message: "Al menos un tipo debe estar seleccionado (cliente, proveedor o empleado)"
})

// GET /api/entidades - Listar entidades con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Filtros disponibles
    const tipo = searchParams.get('tipo') // 'empleado', 'cliente', 'proveedor'
    const empresa_id = searchParams.get('empresa_id')
    const search = searchParams.get('search')
    const activo = searchParams.get('activo')
    const puede_operar_caja = searchParams.get('puede_operar_caja')

    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir filtros WHERE
    const where: any = {}

    // Filtro por tipo
    if (tipo === 'empleado') where.es_empleado = true
    if (tipo === 'cliente') where.es_cliente = true
    if (tipo === 'proveedor') where.es_proveedor = true

    // Filtro por estado
    if (activo !== null) {
      where.activo = activo === 'true'
    }

    // Filtro por puede operar caja (solo para empleados)
    if (puede_operar_caja !== null) {
      where.puede_operar_caja = puede_operar_caja === 'true'
    }

    // Filtro por búsqueda de texto
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filtro por empresa (a través de relaciones)
    let entidadesQuery: any = {
      where,
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
            movimientos_entidad: true,
            movimientos_empleado: true,
            cortes: true,
            saldos: true
          }
        }
      },
      orderBy: { nombre: 'asc' },
      take: limit,
      skip: offset
    }

    // Si filtran por empresa, usar findMany con join
    if (empresa_id) {
      where.entidades_empresas = {
        some: {
          empresa_id: parseInt(empresa_id),
          activo: true
        }
      }
    }

    const entidades = await prisma.entidad.findMany(entidadesQuery)

    // Contar total para paginación
    const total = await prisma.entidad.count({ where })

    // Formatear respuesta
    const entidadesFormateadas = entidades.map(entidad => ({
      id: entidad.id,
      nombre: entidad.nombre,
      telefono: entidad.telefono,
      es_cliente: entidad.es_cliente,
      es_proveedor: entidad.es_proveedor,
      es_empleado: entidad.es_empleado,
      puesto: entidad.puesto,
      puede_operar_caja: entidad.puede_operar_caja,
      activo: entidad.activo,
      created_at: entidad.created_at,
      empresas: entidad.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa_id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion,
        activo: rel.activo
      })),
      contadores: {
        movimientos_como_entidad: entidad._count.movimientos_entidad,
        movimientos_como_empleado: entidad._count.movimientos_empleado,
        cortes: entidad._count.cortes,
        saldos: entidad._count.saldos
      }
    }))

    return NextResponse.json({
      entidades: entidadesFormateadas,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error al obtener entidades:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/entidades - Crear nueva entidad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar datos
    const validatedData = entidadSchema.parse(body)

    // Verificar que el nombre no exista
    const existeEntidad = await prisma.entidad.findFirst({
      where: {
        nombre: validatedData.nombre,
        activo: true
      }
    })

    if (existeEntidad) {
      return NextResponse.json(
        { error: 'Ya existe una entidad con ese nombre' },
        { status: 400 }
      )
    }

    // Crear entidad con transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear entidad
      const nuevaEntidad = await tx.entidad.create({
        data: {
          nombre: validatedData.nombre,
          telefono: validatedData.telefono,
          es_cliente: validatedData.es_cliente,
          es_proveedor: validatedData.es_proveedor,
          es_empleado: validatedData.es_empleado,
          puesto: validatedData.puesto,
          puede_operar_caja: validatedData.puede_operar_caja,
          activo: validatedData.activo
        }
      })

      // Crear relaciones empresa-entidad si se proporcionaron
      if (validatedData.empresas && validatedData.empresas.length > 0) {
        const relaciones = validatedData.empresas.map(rel => ({
          entidad_id: nuevaEntidad.id,
          empresa_id: rel.empresa_id,
          tipo_relacion: rel.tipo_relacion,
          activo: true
        }))

        await tx.entidadEmpresa.createMany({
          data: relaciones
        })
      }

      return nuevaEntidad
    })

    // Obtener entidad completa con relaciones
    const entidadCompleta = await prisma.entidad.findUnique({
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

    return NextResponse.json(entidadCompleta, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear entidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}