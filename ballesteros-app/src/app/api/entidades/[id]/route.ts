import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema de validación para actualizar entidades
const entidadUpdateSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido").optional(),
  telefono: z.string().optional(),
  es_cliente: z.boolean().optional(),
  es_proveedor: z.boolean().optional(),
  es_empleado: z.boolean().optional(),
  puesto: z.string().optional(),
  puede_operar_caja: z.boolean().optional(),
  activo: z.boolean().optional(),
  empresas: z.array(z.object({
    empresa_id: z.number(),
    tipo_relacion: z.enum(['cliente', 'proveedor'])
  })).optional()
})

// GET /api/entidades/[id] - Obtener entidad específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const entidad = await prisma.entidad.findUnique({
      where: { id },
      include: {
        entidades_empresas: {
          include: {
            empresa: {
              select: { id: true, nombre: true, activa: true }
            }
          }
        },
        saldos: {
          include: {
            empresas: {
              select: { id: true, nombre: true }
            }
          }
        },
        _count: {
          select: {
            movimientos_entidad: true,
            movimientos_empleado: true,
            cortes: true
          }
        }
      }
    })

    if (!entidad) {
      return NextResponse.json(
        { error: 'Entidad no encontrada' },
        { status: 404 }
      )
    }

    // Formatear respuesta con información completa
    const entidadFormateada = {
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
        empresa_activa: rel.empresa.activa,
        tipo_relacion: rel.tipo_relacion,
        activo: rel.activo
      })),
      saldos: entidad.saldos.map(saldo => ({
        id: saldo.id,
        tipo_saldo: saldo.tipo_saldo,
        saldo_inicial: saldo.saldo_inicial,
        total_cargos: saldo.total_cargos,
        total_abonos: saldo.total_abonos,
        saldo_actual: saldo.saldo_actual,
        empresa_id: saldo.empresa_id,
        empresa_nombre: saldo.empresas?.nombre,
        fecha_corte: saldo.fecha_corte,
        ultima_actualizacion: saldo.ultima_actualizacion
      })),
      contadores: {
        movimientos_como_entidad: entidad._count.movimientos_entidad,
        movimientos_como_empleado: entidad._count.movimientos_empleado,
        cortes: entidad._count.cortes
      }
    }

    return NextResponse.json(entidadFormateada)

  } catch (error) {
    console.error('Error al obtener entidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/entidades/[id] - Actualizar entidad
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = entidadUpdateSchema.parse(body)

    // Verificar que la entidad existe
    const entidadExistente = await prisma.entidad.findUnique({
      where: { id }
    })

    if (!entidadExistente) {
      return NextResponse.json(
        { error: 'Entidad no encontrada' },
        { status: 404 }
      )
    }

    // Verificar nombre único si se está cambiando
    if (validatedData.nombre && validatedData.nombre !== entidadExistente.nombre) {
      const nombreExiste = await prisma.entidad.findFirst({
        where: {
          nombre: validatedData.nombre,
          activo: true,
          id: { not: id }
        }
      })

      if (nombreExiste) {
        return NextResponse.json(
          { error: 'Ya existe otra entidad con ese nombre' },
          { status: 400 }
        )
      }
    }

    // Validar que al menos un tipo esté activo
    const tiposActivos = [
      validatedData.es_cliente ?? entidadExistente.es_cliente,
      validatedData.es_proveedor ?? entidadExistente.es_proveedor,
      validatedData.es_empleado ?? entidadExistente.es_empleado
    ]

    if (!tiposActivos.some(tipo => tipo)) {
      return NextResponse.json(
        { error: 'Al menos un tipo debe estar seleccionado (cliente, proveedor o empleado)' },
        { status: 400 }
      )
    }

    // Actualizar con transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar entidad
      const entidadActualizada = await tx.entidad.update({
        where: { id },
        data: {
          ...(validatedData.nombre && { nombre: validatedData.nombre }),
          ...(validatedData.telefono !== undefined && { telefono: validatedData.telefono }),
          ...(validatedData.es_cliente !== undefined && { es_cliente: validatedData.es_cliente }),
          ...(validatedData.es_proveedor !== undefined && { es_proveedor: validatedData.es_proveedor }),
          ...(validatedData.es_empleado !== undefined && { es_empleado: validatedData.es_empleado }),
          ...(validatedData.puesto !== undefined && { puesto: validatedData.puesto }),
          ...(validatedData.puede_operar_caja !== undefined && { puede_operar_caja: validatedData.puede_operar_caja }),
          ...(validatedData.activo !== undefined && { activo: validatedData.activo })
        }
      })

      // Actualizar relaciones empresa-entidad si se proporcionaron
      if (validatedData.empresas) {
        // Eliminar relaciones existentes
        await tx.entidadEmpresa.deleteMany({
          where: { entidad_id: id }
        })

        // Crear nuevas relaciones
        if (validatedData.empresas.length > 0) {
          const relaciones = validatedData.empresas.map(rel => ({
            entidad_id: id,
            empresa_id: rel.empresa_id,
            tipo_relacion: rel.tipo_relacion,
            activo: true
          }))

          await tx.entidadEmpresa.createMany({
            data: relaciones
          })
        }
      }

      return entidadActualizada
    })

    // Obtener entidad completa actualizada
    const entidadCompleta = await prisma.entidad.findUnique({
      where: { id },
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

    return NextResponse.json(entidadCompleta)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al actualizar entidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/entidades/[id] - Soft delete de entidad
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    // Verificar que la entidad existe
    const entidadExistente = await prisma.entidad.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            movimientos_entidad: true,
            movimientos_empleado: true,
            cortes: true
          }
        }
      }
    })

    if (!entidadExistente) {
      return NextResponse.json(
        { error: 'Entidad no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si tiene movimientos o cortes asociados
    const tieneMovimientos = entidadExistente._count.movimientos_entidad > 0 ||
                           entidadExistente._count.movimientos_empleado > 0 ||
                           entidadExistente._count.cortes > 0

    if (tieneMovimientos) {
      // Soft delete: marcar como inactivo
      const entidadDesactivada = await prisma.entidad.update({
        where: { id },
        data: { activo: false }
      })

      return NextResponse.json({
        message: 'Entidad desactivada (tiene movimientos asociados)',
        entidad: entidadDesactivada
      })
    } else {
      // Hard delete: eliminar completamente
      await prisma.$transaction(async (tx) => {
        // Eliminar relaciones empresa-entidad
        await tx.entidadEmpresa.deleteMany({
          where: { entidad_id: id }
        })

        // Eliminar saldos
        await tx.saldo.deleteMany({
          where: { entidad_id: id }
        })

        // Eliminar entidad
        await tx.entidad.delete({
          where: { id }
        })
      })

      return NextResponse.json({
        message: 'Entidad eliminada permanentemente'
      })
    }

  } catch (error) {
    console.error('Error al eliminar entidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}