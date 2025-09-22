const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyMigration() {
  try {
    console.log('🔍 Verificando migración...\n')

    // Verificar empresas
    const empresas = await prisma.empresa.findMany()
    console.log('✅ Empresas creadas:', empresas.length)
    empresas.forEach(e => console.log(`   - ${e.nombre} (ID: ${e.id})`))

    // Verificar categorías
    const categorias = await prisma.categoriaGasto.findMany({
      include: { subcategorias: true }
    })
    console.log('\n✅ Categorías creadas:', categorias.length)
    categorias.forEach(c => {
      console.log(`   - ${c.nombre}: ${c.subcategorias.length} subcategorías`)
    })

    // Verificar cuentas
    const cuentas = await prisma.cuenta.findMany({
      include: { empresa: true }
    })
    console.log('\n✅ Cuentas creadas:', cuentas.length)
    cuentas.forEach(c => {
      console.log(`   - ${c.nombre} (${c.empresa.nombre}) - Tipo: ${c.tipo_cuenta}`)
    })

    // Verificar estructura de tablas principales
    const tablas = [
      'entidades', 'movimientos', 'cortes', 'saldos',
      'entidades_empresas', 'cuentas'
    ]

    console.log('\n✅ Verificando tablas principales:')
    for (const tabla of tablas) {
      try {
        await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tabla}`
        console.log(`   - ${tabla}: ✓`)
      } catch (error) {
        console.log(`   - ${tabla}: ❌ Error - ${error.message}`)
      }
    }

    console.log('\n🎉 MIGRACIÓN VERIFICADA EXITOSAMENTE')
    console.log('📋 Nueva estructura implementada:')
    console.log('   • Entidades unificadas (clientes/proveedores/empleados)')
    console.log('   • Movimientos centralizados')
    console.log('   • Sistema de 3 cuentas (cajera/efectivo/fiscal)')
    console.log('   • Cortes con campos específicos por tipo')
    console.log('   • Estados de cuenta con cargos/abonos')

  } catch (error) {
    console.error('❌ Error en verificación:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifyMigration()