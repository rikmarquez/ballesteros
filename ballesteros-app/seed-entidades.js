const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedEntidades() {
  try {
    console.log('🌱 Creando entidades de prueba...\n')

    // Empleados (es_empleado = true)
    const empleados = [
      { nombre: 'María García', telefono: '555-0101', puesto: 'Cajera', puede_operar_caja: true },
      { nombre: 'Juan Pérez', telefono: '555-0102', puesto: 'Carnicero', puede_operar_caja: false },
      { nombre: 'Ana Rodríguez', telefono: '555-0103', puesto: 'Contadora', puede_operar_caja: true },
      { nombre: 'Carlos López', telefono: '555-0104', puesto: 'Encargado', puede_operar_caja: true }
    ]

    console.log('👥 Creando empleados...')
    for (const emp of empleados) {
      const empleado = await prisma.entidad.create({
        data: {
          ...emp,
          es_empleado: true,
          activo: true
        }
      })
      console.log(`   ✓ ${empleado.nombre} - ${empleado.puesto}`)
    }

    // Clientes (es_cliente = true)
    const clientes = [
      { nombre: 'Restaurante El Buen Sabor', telefono: '555-0201' },
      { nombre: 'Hotel Plaza', telefono: '555-0202' },
      { nombre: 'Familia Hernández', telefono: '555-0203' },
      { nombre: 'Carnicería San José', telefono: '555-0204' },
      { nombre: 'Rosario Martínez', telefono: '555-0205' }
    ]

    console.log('\n🏪 Creando clientes...')
    for (const cli of clientes) {
      const cliente = await prisma.entidad.create({
        data: {
          ...cli,
          es_cliente: true,
          activo: true
        }
      })
      console.log(`   ✓ ${cliente.nombre}`)

      // Crear relaciones empresa-cliente (clientes pueden estar en múltiples empresas)
      const empresas = [1, 2, 3] // Principal, Express, Asadero
      for (const empresaId of empresas) {
        await prisma.entidadEmpresa.create({
          data: {
            entidad_id: cliente.id,
            empresa_id: empresaId,
            tipo_relacion: 'cliente',
            activo: true
          }
        })
      }
    }

    // Proveedores (es_proveedor = true)
    const proveedores = [
      { nombre: 'Carnes del Norte S.A.', telefono: '555-0301' },
      { nombre: 'Frigorífico Central', telefono: '555-0302' },
      { nombre: 'Distribuidora La Vaca', telefono: '555-0303' },
      { nombre: 'Abarrotes Mayorista', telefono: '555-0304' },
      { nombre: 'Servicios Eléctricos', telefono: '555-0305' }
    ]

    console.log('\n🚚 Creando proveedores...')
    for (const prov of proveedores) {
      const proveedor = await prisma.entidad.create({
        data: {
          ...prov,
          es_proveedor: true,
          activo: true
        }
      })
      console.log(`   ✓ ${proveedor.nombre}`)

      // Crear relaciones empresa-proveedor
      const empresas = [1, 2, 3] // Todos los proveedores sirven a todas las empresas
      for (const empresaId of empresas) {
        await prisma.entidadEmpresa.create({
          data: {
            entidad_id: proveedor.id,
            empresa_id: empresaId,
            tipo_relacion: 'proveedor',
            activo: true
          }
        })
      }
    }

    // Entidad híbrida (cliente Y proveedor)
    console.log('\n🔄 Creando entidad híbrida...')
    const hibridaData = {
      nombre: 'Carnicería Los Hermanos',
      telefono: '555-0401',
      es_cliente: true,
      es_proveedor: true,
      activo: true
    }

    const hibrida = await prisma.entidad.create({
      data: hibridaData
    })
    console.log(`   ✓ ${hibrida.nombre} (Cliente Y Proveedor)`)

    // Relaciones para entidad híbrida
    for (const empresaId of [1, 2, 3]) {
      await prisma.entidadEmpresa.createMany({
        data: [
          {
            entidad_id: hibrida.id,
            empresa_id: empresaId,
            tipo_relacion: 'cliente',
            activo: true
          },
          {
            entidad_id: hibrida.id,
            empresa_id: empresaId,
            tipo_relacion: 'proveedor',
            activo: true
          }
        ]
      })
    }

    console.log('\n🎉 SEEDING COMPLETADO EXITOSAMENTE')
    console.log('📊 Resumen creado:')
    console.log(`   • ${empleados.length} empleados`)
    console.log(`   • ${clientes.length} clientes`)
    console.log(`   • ${proveedores.length} proveedores`)
    console.log(`   • 1 entidad híbrida`)
    console.log(`   • Relaciones empresa-entidad creadas`)

  } catch (error) {
    console.error('❌ Error en seeding:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

seedEntidades()