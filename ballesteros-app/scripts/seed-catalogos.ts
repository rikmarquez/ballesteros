import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de catálogos...')

  try {
    // 1. Empresas
    console.log('📊 Creando empresas...')
    const empresas = await Promise.all([
      prisma.empresa.upsert({
        where: { id: 1 },
        update: {},
        create: {
          id: 1,
          nombre: 'Principal',
          activa: true
        }
      }),
      prisma.empresa.upsert({
        where: { id: 2 },
        update: {},
        create: {
          id: 2,
          nombre: 'Express',
          activa: true
        }
      }),
      prisma.empresa.upsert({
        where: { id: 3 },
        update: {},
        create: {
          id: 3,
          nombre: 'Asadero',
          activa: true
        }
      })
    ])
    console.log(`✅ ${empresas.length} empresas creadas`)

    // 2. Empleados
    console.log('👥 Creando empleados...')
    const empleados = [
      { nombre: 'María González', puesto: 'Contadora', puede_operar_caja: true, telefono: '999-123-4567' },
      { nombre: 'Juan Pérez', puesto: 'Carnicero', puede_operar_caja: true, telefono: '999-234-5678' },
      { nombre: 'Ana Rodríguez', puesto: 'Cajera', puede_operar_caja: true, telefono: '999-345-6789' },
      { nombre: 'Carlos López', puesto: 'Ayudante', puede_operar_caja: false, telefono: '999-456-7890' },
      { nombre: 'Sofia Martín', puesto: 'Cajera', puede_operar_caja: true, telefono: '999-567-8901' },
      { nombre: 'Diego Hernández', puesto: 'Carnicero', puede_operar_caja: true, telefono: '999-678-9012' }
    ]

    for (const empleadoData of empleados) {
      const existe = await prisma.empleado.findFirst({
        where: { nombre: empleadoData.nombre }
      })

      if (!existe) {
        await prisma.empleado.create({
          data: empleadoData
        })
      }
    }
    console.log(`✅ ${empleados.length} empleados creados`)

    // 3. Categorías de gasto
    console.log('📝 Creando categorías de gasto...')
    const categorias = [
      { id: 1, nombre: 'Compra de Mercancía', tipo: 'compra' },
      { id: 2, nombre: 'Servicios Básicos', tipo: 'servicio' },
      { id: 3, nombre: 'Mantenimiento', tipo: 'mantenimiento' },
      { id: 4, nombre: 'Gastos de Personal', tipo: 'personal' },
      { id: 5, nombre: 'Otros Gastos', tipo: 'otros' }
    ]

    for (const categoriaData of categorias) {
      await prisma.categoriaGasto.upsert({
        where: { id: categoriaData.id },
        update: {},
        create: categoriaData
      })
    }
    console.log(`✅ ${categorias.length} categorías creadas`)

    // 4. Subcategorías de gasto
    console.log('📋 Creando subcategorías de gasto...')
    const subcategorias = [
      // Compra de Mercancía
      { categoria_id: 1, nombre: 'Carne de Res' },
      { categoria_id: 1, nombre: 'Carne de Cerdo' },
      { categoria_id: 1, nombre: 'Pollo' },
      { categoria_id: 1, nombre: 'Mariscos' },
      { categoria_id: 1, nombre: 'Embutidos' },

      // Servicios Básicos
      { categoria_id: 2, nombre: 'Electricidad' },
      { categoria_id: 2, nombre: 'Agua' },
      { categoria_id: 2, nombre: 'Gas' },
      { categoria_id: 2, nombre: 'Internet/Teléfono' },

      // Mantenimiento
      { categoria_id: 3, nombre: 'Equipo de Refrigeración' },
      { categoria_id: 3, nombre: 'Báscula' },
      { categoria_id: 3, nombre: 'Instalaciones' },
      { categoria_id: 3, nombre: 'Vehículos' },

      // Gastos de Personal
      { categoria_id: 4, nombre: 'Sueldos' },
      { categoria_id: 4, nombre: 'Prestaciones' },
      { categoria_id: 4, nombre: 'Uniformes' },

      // Otros Gastos
      { categoria_id: 5, nombre: 'Materiales de Limpieza' },
      { categoria_id: 5, nombre: 'Papelería' },
      { categoria_id: 5, nombre: 'Combustible' },
      { categoria_id: 5, nombre: 'Viáticos' }
    ]

    for (const subcategoriaData of subcategorias) {
      const existe = await prisma.subcategoriaGasto.findFirst({
        where: {
          categoria_id: subcategoriaData.categoria_id,
          nombre: subcategoriaData.nombre
        }
      })

      if (!existe) {
        await prisma.subcategoriaGasto.create({
          data: subcategoriaData
        })
      }
    }
    console.log(`✅ ${subcategorias.length} subcategorías creadas`)

    // 5. Clientes para cada empresa
    console.log('👤 Creando clientes...')
    const clientesData = [
      // Principal
      { empresa_id: 1, nombre: 'Restaurante El Buen Sabor', telefono: '999-111-2222', saldo_inicial: 0 },
      { empresa_id: 1, nombre: 'Taquería Los Compadres', telefono: '999-222-3333', saldo_inicial: 500 },
      { empresa_id: 1, nombre: 'Hotel Plaza', telefono: '999-333-4444', saldo_inicial: 0 },
      { empresa_id: 1, nombre: 'María Elena Vázquez', telefono: '999-444-5555', saldo_inicial: 200 },

      // Express
      { empresa_id: 2, nombre: 'Tienda Doña Carmen', telefono: '999-555-6666', saldo_inicial: 0 },
      { empresa_id: 2, nombre: 'Lonchería El Rápido', telefono: '999-666-7777', saldo_inicial: 300 },
      { empresa_id: 2, nombre: 'Jorge Ramírez', telefono: '999-777-8888', saldo_inicial: 150 },

      // Asadero
      { empresa_id: 3, nombre: 'Eventos Los Pinos', telefono: '999-888-9999', saldo_inicial: 0 },
      { empresa_id: 3, nombre: 'Quinceañera Eventos', telefono: '999-999-0000', saldo_inicial: 800 },
      { empresa_id: 3, nombre: 'Restaurant Los Arcos', telefono: '999-000-1111', saldo_inicial: 0 }
    ]

    for (const clienteData of clientesData) {
      const existe = await prisma.cliente.findFirst({
        where: {
          empresa_id: clienteData.empresa_id,
          nombre: clienteData.nombre
        }
      })

      if (!existe) {
        await prisma.cliente.create({
          data: clienteData
        })
      }
    }
    console.log(`✅ ${clientesData.length} clientes creados`)

    // 6. Proveedores para cada empresa
    console.log('🏪 Creando proveedores...')
    const proveedoresData = [
      // Principal
      { empresa_id: 1, nombre: 'Frigorífico San Luis' },
      { empresa_id: 1, nombre: 'Carnes del Norte' },
      { empresa_id: 1, nombre: 'Distribuidora La Central' },
      { empresa_id: 1, nombre: 'CFE Comisión Federal de Electricidad' },

      // Express
      { empresa_id: 2, nombre: 'Frigorífico San Luis' },
      { empresa_id: 2, nombre: 'Pollo Feliz Distribuidora' },
      { empresa_id: 2, nombre: 'CFE Comisión Federal de Electricidad' },

      // Asadero
      { empresa_id: 3, nombre: 'Carnes Premium' },
      { empresa_id: 3, nombre: 'Embutidos del Valle' },
      { empresa_id: 3, nombre: 'Gas del Sureste' }
    ]

    for (const proveedorData of proveedoresData) {
      const existe = await prisma.proveedor.findFirst({
        where: {
          empresa_id: proveedorData.empresa_id,
          nombre: proveedorData.nombre
        }
      })

      if (!existe) {
        await prisma.proveedor.create({
          data: proveedorData
        })
      }
    }
    console.log(`✅ ${proveedoresData.length} proveedores creados`)

    console.log('🎉 Seed de catálogos completado exitosamente!')

  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })