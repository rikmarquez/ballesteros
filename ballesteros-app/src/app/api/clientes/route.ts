import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para crear cliente
const createClienteSchema = z.object({
  empresa_id: z.number().int().positive(),
  nombre: z.string().min(1).max(255),
  telefono: z.string().max(20).optional(),
  saldo_inicial: z.number().default(0).transform(val => Number(val.toFixed(2)))
})

// GET /api/clientes - Listar clientes (usando tabla entidades)
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
      es_cliente: true // Solo entidades que son clientes
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Construir query con filtro de empresa si se especifica
    let clientesQuery: any = {
      where,
      include: {
        entidades_empresas: {
          where: {
            tipo_relacion: 'cliente',
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
          tipo_relacion: 'cliente',
          activo: true
        }
      }
    }

    const clientes = await prisma.entidad.findMany(clientesQuery)

    // Formatear respuesta para compatibilidad
    const clientesFormateados = clientes.map(cliente => ({
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      activo: cliente.activo,
      created_at: cliente.created_at,
      empresas: cliente.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa_id,
        empresa_nombre: rel.empresa.nombre,
        activo: rel.activo
      })),
      _count: {
        movimientos: cliente._count.movimientos_entidad,
        saldos: cliente._count.saldos
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

    // Crear cliente en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear entidad cliente
      const nuevoCliente = await tx.entidad.create({
        data: {
          nombre: validatedData.nombre,
          telefono: validatedData.telefono,
          es_cliente: true,
          es_empleado: false,
          es_proveedor: false,
          activo: true
        }
      })

      // Crear relación empresa-cliente
      await tx.entidadEmpresa.create({
        data: {
          entidad_id: nuevoCliente.id,
          empresa_id: validatedData.empresa_id,
          tipo_relacion: 'cliente',
          activo: true
        }
      })

      // Crear saldo inicial si es mayor a 0
      if (validatedData.saldo_inicial > 0) {
        await tx.saldo.create({
          data: {
            entidad_id: nuevoCliente.id,
            empresa_id: validatedData.empresa_id,
            tipo_saldo: 'cuenta_cobrar',
            saldo_inicial: validatedData.saldo_inicial,
            saldo_actual: validatedData.saldo_inicial
          }
        })
      }

      return nuevoCliente
    })

    // Obtener cliente completo para respuesta
    const clienteCompleto = await prisma.entidad.findUnique({
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
    const clienteFormateado = {
      id: clienteCompleto!.id,
      nombre: clienteCompleto!.nombre,
      telefono: clienteCompleto!.telefono,
      activo: clienteCompleto!.activo,
      created_at: clienteCompleto!.created_at,
      empresa: clienteCompleto!.entidades_empresas[0]?.empresa,
      saldo_inicial: validatedData.saldo_inicial
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