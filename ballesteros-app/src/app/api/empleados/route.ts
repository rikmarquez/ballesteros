import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para crear empleado
const createEmpleadoSchema = z.object({
  nombre: z.string().min(1).max(255),
  telefono: z.string().max(20).optional().nullable(),
  puesto: z.string().max(100).optional().nullable(),
  saldo_inicial: z.number().min(0).optional().default(0),
  empresa_activa_id: z.number().optional().nullable(), // Para saldo inicial específico - permite null
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
        entidades_empresas: {
          include: {
            empresa: {
              select: { id: true, nombre: true }
            }
          }
        },
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
      empresas: emp.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa.id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion
      })),
      contadores: {
        movimientos_como_empleado: emp._count.movimientos_empleado,
        cortes: emp._count.cortes
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
  console.log('🚀 INICIO POST /api/empleados') // TEMP DEBUG
  try {
    console.log('🔐 Verificando autenticación...') // TEMP DEBUG
    const session = await auth()
    if (!session) {
      console.log('❌ Sin autenticación') // TEMP DEBUG
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.log('✅ Autenticado:', session.user?.name) // TEMP DEBUG

    console.log('📥 Obteniendo body...') // TEMP DEBUG
    const body = await request.json()
    console.log('📊 Datos recibidos en API empleados:', body) // TEMP DEBUG

    console.log('🔍 Validando con Zod...') // TEMP DEBUG
    const validatedData = createEmpleadoSchema.parse(body)
    console.log('✅ Datos validados:', validatedData) // TEMP DEBUG

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

    // Usar transacción para crear empleado, asignarlo a empresas y crear saldo inicial
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear empleado como entidad
      const empleado = await tx.entidad.create({
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

      // Obtener todas las empresas activas y asignar el empleado a todas
      const empresasActivas = await tx.empresa.findMany({
        where: { activa: true },
        select: { id: true }
      })

      // Crear relaciones con TODAS las empresas activas
      if (empresasActivas.length > 0) {
        await tx.entidadEmpresa.createMany({
          data: empresasActivas.map(empresa => ({
            entidad_id: empleado.id,
            empresa_id: empresa.id,
            tipo_relacion: 'empleado',
            activo: true
          }))
        })

        // Si hay saldo inicial, crear saldo GLOBAL para empleado (sin empresa específica)
        if (validatedData.saldo_inicial > 0) {
          console.log(`💰 Procesando saldo inicial GLOBAL: ${validatedData.saldo_inicial}`) // TEMP DEBUG

          await tx.saldo.create({
            data: {
              entidad_id: empleado.id,
              empresa_id: null, // Saldo GLOBAL - no específico de empresa
              tipo_saldo: 'prestamo',
              saldo_inicial: validatedData.saldo_inicial,
              total_cargos: validatedData.saldo_inicial,
              total_abonos: 0,
              saldo_actual: validatedData.saldo_inicial,
              fecha_corte: new Date()
            }
          })
          console.log(`✅ Saldo GLOBAL creado exitosamente`) // TEMP DEBUG
        }
      }

      return empleado
    })

    // Obtener empleado completo con empresas para respuesta
    const empleadoCompleto = await prisma.entidad.findUnique({
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
    const empleadoFormateado = {
      id: resultado.id,
      nombre: resultado.nombre,
      telefono: resultado.telefono,
      puesto: resultado.puesto,
      puede_operar_caja: resultado.puede_operar_caja,
      activo: resultado.activo,
      created_at: resultado.created_at,
      empresas: empleadoCompleto?.entidades_empresas.map(rel => ({
        empresa_id: rel.empresa.id,
        empresa_nombre: rel.empresa.nombre,
        tipo_relacion: rel.tipo_relacion
      })) || []
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