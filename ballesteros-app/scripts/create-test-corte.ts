import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Creando corte de prueba...')

  try {
    // Crear un corte básico
    const corte = await prisma.corteCaja.create({
      data: {
        empresa_id: 1,
        empleado_id: 1,
        fecha: new Date(),
        sesion: 1,
        venta_neta: 5000.00,
        efectivo_esperado: 4200.00,
        efectivo_real: 4150.00,
        diferencia: -50.00,
        tags: 'Corte de prueba',
        adeudo_generado: false,
        estado: 'activo'
      }
    })

    console.log(`✅ Corte creado: ID ${corte.id}`)

    // Crear algunos movimientos de ejemplo
    await prisma.ventaCorte.create({
      data: {
        corte_id: corte.id,
        forma_pago: 'efectivo',
        monto: 1500.00,
        tags: 'Venta efectivo ejemplo'
      }
    })

    await prisma.ventaCorte.create({
      data: {
        corte_id: corte.id,
        forma_pago: 'tarjeta',
        monto: 800.00,
        tags: 'Venta tarjeta ejemplo'
      }
    })

    await prisma.ingresoTurno.create({
      data: {
        corte_id: corte.id,
        tipo: 'cobranza',
        monto: 300.00,
        tags: 'Cobranza ejemplo'
      }
    })

    await prisma.egresoTurno.create({
      data: {
        corte_id: corte.id,
        tipo: 'gasto',
        monto: 200.00,
        categoria_id: 1,
        tags: 'Gasto ejemplo'
      }
    })

    console.log('✅ Movimientos de ejemplo creados')
    console.log(`🎯 Corte listo para pruebas: /dashboard/cortes/${corte.id}/editar`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()