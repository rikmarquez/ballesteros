const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function recrearCuentas() {
  try {
    console.log('🗑️  Eliminando todas las cuentas existentes...')

    // Eliminar todas las cuentas existentes
    const deletedCount = await prisma.cuenta.deleteMany({})
    console.log(`✅ Eliminadas ${deletedCount.count} cuentas`)

    // Crear las tres cuentas específicas SIN empresa_id
    const cuentasACrear = [
      {
        tipo_cuenta: 'efectivo',
        nombre: 'Caja Contadora Principal',
        saldo_actual: 0,
        activa: true
      },
      {
        tipo_cuenta: 'fiscal',
        nombre: 'Cuenta Fiscal Principal',
        saldo_actual: 0,
        activa: true
      },
      {
        tipo_cuenta: 'fiscal',
        nombre: 'Cuenta Fiscal Carlos',
        saldo_actual: 0,
        activa: true
      }
    ]

    console.log('🏦 Creando las 3 cuentas específicas (SIN ligar a empresas)...')

    for (const cuentaData of cuentasACrear) {
      const cuenta = await prisma.cuenta.create({
        data: cuentaData
      })

      console.log(`✅ Creada: ${cuenta.nombre} (${cuenta.tipo_cuenta}) - ID: ${cuenta.id}`)
    }

    console.log('🎉 Proceso completado exitosamente')
    console.log('📊 Cuentas finales (TRANSVERSALES - sin empresa específica):')

    const cuentasFinales = await prisma.cuenta.findMany({
      orderBy: { id: 'asc' }
    })

    cuentasFinales.forEach(cuenta => {
      console.log(`   - ${cuenta.nombre} (${cuenta.tipo_cuenta}) - ${cuenta.saldo_actual}`)
    })

    console.log('')
    console.log('✨ Estas cuentas pueden recibir dinero de TODAS las empresas')
    console.log('💡 Por ejemplo: cortes de Express y Principal van a "Caja Contadora Principal"')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

recrearCuentas()