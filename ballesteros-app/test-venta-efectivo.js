const { PrismaClient } = require('@prisma/client');

async function probarVentaEfectivo() {
  const prisma = new PrismaClient();

  try {
    console.log('🧪 Probando VENTA EN EFECTIVO...\n');

    // Simular el payload del formulario
    const ventaData = {
      tipo_movimiento: 'venta_efectivo',
      es_ingreso: true,
      es_traspaso: false,
      monto: 1500.50,
      fecha: new Date().toISOString(),
      empresa_id: 1, // Carniceria Ballesteros
      cuenta_destino_id: 19, // Cajera Carnicería
      empleado_responsable_id: 1, // María García
      referencia: 'Venta del día - efectivo de mostrador'
    };

    console.log('📝 Datos de la venta:');
    console.log(`   Monto: $${ventaData.monto}`);
    console.log(`   Empresa: Carnicería Ballesteros`);
    console.log(`   Cajera: María García`);
    console.log(`   Cuenta destino: Cajera Carnicería`);

    // Obtener saldo anterior
    const cuentaAntes = await prisma.cuenta.findUnique({
      where: { id: 19 }
    });
    console.log(`   Saldo anterior: $${cuentaAntes.saldo_actual}`);

    // Crear la venta usando transacción (como la API)
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear movimiento
      const nuevoMovimiento = await tx.movimiento.create({
        data: ventaData,
        include: {
          cuenta_destino: { select: { nombre: true } },
          empleado_responsable: { select: { nombre: true } },
          empresa: { select: { nombre: true } }
        }
      });

      // 2. Actualizar saldo de cuenta destino
      await tx.cuenta.update({
        where: { id: ventaData.cuenta_destino_id },
        data: {
          saldo_actual: {
            increment: ventaData.monto
          }
        }
      });

      return nuevoMovimiento;
    });

    console.log('\n✅ Venta registrada exitosamente!');
    console.log(`   ID del movimiento: ${resultado.id}`);
    console.log(`   Tipo: ${resultado.tipo_movimiento}`);
    console.log(`   Es ingreso: ${resultado.es_ingreso}`);
    console.log(`   Es traspaso: ${resultado.es_traspaso}`);

    // Verificar saldo actualizado
    const cuentaDespues = await prisma.cuenta.findUnique({
      where: { id: 19 }
    });
    console.log(`   Nuevo saldo: $${cuentaDespues.saldo_actual}`);
    console.log(`   Incremento: $${Number(cuentaDespues.saldo_actual) - Number(cuentaAntes.saldo_actual)}`);

    // Verificar que aparece en listado de movimientos
    console.log('\n📋 Verificando en listado de movimientos...');
    const movimientos = await prisma.movimiento.findMany({
      where: {
        tipo_movimiento: 'venta_efectivo',
        es_ingreso: true,
        es_traspaso: false
      },
      include: {
        cuenta_destino: { select: { nombre: true } },
        empleado_responsable: { select: { nombre: true } },
        empresa: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    console.log(`✅ Total de ventas en efectivo: ${movimientos.length}`);
    movimientos.slice(0, 3).forEach(mov => {
      console.log(`   - [${mov.id}] $${mov.monto} en ${mov.cuenta_destino?.nombre} por ${mov.empleado_responsable?.nombre}`);
    });

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Prueba completada!');
}

probarVentaEfectivo();