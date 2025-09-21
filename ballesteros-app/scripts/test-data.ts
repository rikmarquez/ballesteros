import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testData() {
  console.log('🧪 Verificando datos en la base de datos...\n')

  try {
    // Test empresas
    const empresas = await prisma.empresa.findMany()
    console.log('📊 Empresas:')
    empresas.forEach(empresa => {
      console.log(`  - ${empresa.id}: ${empresa.nombre} (${empresa.activa ? 'Activa' : 'Inactiva'})`)
    })
    console.log()

    // Test empleados que pueden operar caja
    const empleados = await prisma.empleado.findMany({
      where: { puede_operar_caja: true, activo: true }
    })
    console.log('👥 Empleados que pueden operar caja:')
    empleados.forEach(empleado => {
      console.log(`  - ${empleado.id}: ${empleado.nombre} (${empleado.puesto})`)
    })
    console.log()

    // Test categorías
    const categorias = await prisma.categoriaGasto.findMany({
      include: {
        _count: {
          select: { subcategorias: true }
        }
      }
    })
    console.log('📝 Categorías de gasto:')
    categorias.forEach(categoria => {
      console.log(`  - ${categoria.id}: ${categoria.nombre} (${categoria._count.subcategorias} subcategorías)`)
    })
    console.log()

    // Test clientes por empresa
    for (const empresa of empresas) {
      const clientes = await prisma.cliente.findMany({
        where: { empresa_id: empresa.id }
      })
      console.log(`👤 Clientes de ${empresa.nombre}:`)
      clientes.forEach(cliente => {
        console.log(`  - ${cliente.id}: ${cliente.nombre} (Saldo: $${cliente.saldo_inicial})`)
      })
      console.log()
    }

    // Test proveedores por empresa
    for (const empresa of empresas) {
      const proveedores = await prisma.proveedor.findMany({
        where: { empresa_id: empresa.id }
      })
      console.log(`🏪 Proveedores de ${empresa.nombre}:`)
      proveedores.forEach(proveedor => {
        console.log(`  - ${proveedor.id}: ${proveedor.nombre}`)
      })
      console.log()
    }

    console.log('✅ Todos los datos están correctamente creados!')

  } catch (error) {
    console.error('❌ Error verificando datos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testData()