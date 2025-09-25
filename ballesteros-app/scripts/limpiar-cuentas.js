const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function limpiarCuentas() {
  try {
    console.log('🗑️  Eliminando todas las cuentas existentes...')

    // Eliminar todas las cuentas existentes
    const deletedCount = await prisma.cuenta.deleteMany({})
    console.log(`✅ Eliminadas ${deletedCount.count} cuentas`)

    // Obtener las empresas existentes
    const empresas = await prisma.empresa.findMany({
      where: { activa: true },
      select: { id: true, nombre: true }
    })

    console.log('🏢 Empresas disponibles:', empresas.map(e => `${e.id}: ${e.nombre}`))

    // Buscar empresa principal (primera activa)
    const empresaPrincipal = empresas[0]

    if (!empresaPrincipal) {
      throw new Error('No se encontró ninguna empresa activa')
    }

    console.log(`🏢 Usando empresa principal: ${empresaPrincipal.nombre} (ID: ${empresaPrincipal.id})`)

    // Crear las tres cuentas específicas
    const cuentasACrear = [
      {
        empresa_id: empresaPrincipal.id,
        tipo_cuenta: 'efectivo',
        nombre: 'Caja Contadora Principal',
        saldo_actual: 0,
        activa: true
      },
      {
        empresa_id: empresaPrincipal.id,
        tipo_cuenta: 'fiscal',
        nombre: 'Cuenta Fiscal Principal',
        saldo_actual: 0,
        activa: true
      },
      {
        empresa_id: empresaPrincipal.id,
        tipo_cuenta: 'fiscal',
        nombre: 'Cuenta Fiscal Carlos',
        saldo_actual: 0,
        activa: true
      }
    ]

    console.log('🏦 Creando las 3 cuentas específicas...')

    for (const cuentaData of cuentasACrear) {
      const cuenta = await prisma.cuenta.create({
        data: cuentaData,
        include: {
          empresa: {
            select: { nombre: true }
          }
        }
      })

      console.log(`✅ Creada: ${cuenta.nombre} (${cuenta.tipo_cuenta}) - ${cuenta.empresa.nombre}`)
    }

    console.log('🎉 Proceso completado exitosamente')
    console.log('📊 Cuentas finales:')

    const cuentasFinales = await prisma.cuenta.findMany({
      include: {
        empresa: {
          select: { nombre: true }
        }
      },
      orderBy: { id: 'asc' }
    })

    cuentasFinales.forEach(cuenta => {
      console.log(`   - ${cuenta.nombre} (${cuenta.tipo_cuenta}) - ${cuenta.empresa.nombre}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

limpiarCuentas()