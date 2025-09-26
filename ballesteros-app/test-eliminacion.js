const { PrismaClient } = require('@prisma/client');

async function probarEliminacion() {
  const prisma = new PrismaClient();

  try {
    console.log('🧪 Probando funcionalidad de eliminación de movimientos...\n');

    // 1. Mostrar movimientos actuales
    console.log('📋 Movimientos actuales:');
    const movimientos = await prisma.movimiento.findMany({
      include: {
        cuenta_origen: { select: { nombre: true, saldo_actual: true } },
        cuenta_destino: { select: { nombre: true, saldo_actual: true } },
        empresa: { select: { nombre: true } }
      },
      orderBy: { id: 'desc' }
    });

    movimientos.forEach(mov => {
      console.log(`   - [${mov.id}] ${mov.tipo_movimiento} $${mov.monto}`);
      console.log(`     ${mov.es_traspaso ? 'TRASPASO' : (mov.es_ingreso ? 'INGRESO' : 'EGRESO')}`);
      if (mov.cuenta_origen) console.log(`     Origen: ${mov.cuenta_origen.nombre} ($${mov.cuenta_origen.saldo_actual})`);
      if (mov.cuenta_destino) console.log(`     Destino: ${mov.cuenta_destino.nombre} ($${mov.cuenta_destino.saldo_actual})`);
      console.log('');
    });

    if (movimientos.length === 0) {
      console.log('   No hay movimientos para eliminar');
      return;
    }

    // 2. Seleccionar el último movimiento para eliminar
    const movimientoAEliminar = movimientos[0];
    console.log(`🎯 Seleccionado para eliminación: [${movimientoAEliminar.id}] ${movimientoAEliminar.tipo_movimiento}`);
    console.log(`   Monto: $${movimientoAEliminar.monto}`);
    console.log(`   Tipo: ${movimientoAEliminar.es_traspaso ? 'TRASPASO' : (movimientoAEliminar.es_ingreso ? 'INGRESO' : 'EGRESO')}`);

    // Mostrar saldos antes
    const saldosAntes = [];
    if (movimientoAEliminar.cuenta_origen_id) {
      const cuenta = await prisma.cuenta.findUnique({ where: { id: movimientoAEliminar.cuenta_origen_id } });
      saldosAntes.push({ id: cuenta.id, nombre: cuenta.nombre, saldo: cuenta.saldo_actual, tipo: 'origen' });
    }
    if (movimientoAEliminar.cuenta_destino_id) {
      const cuenta = await prisma.cuenta.findUnique({ where: { id: movimientoAEliminar.cuenta_destino_id } });
      saldosAntes.push({ id: cuenta.id, nombre: cuenta.nombre, saldo: cuenta.saldo_actual, tipo: 'destino' });
    }

    console.log('\n💰 Saldos ANTES de eliminar:');
    saldosAntes.forEach(cuenta => {
      console.log(`   ${cuenta.nombre} (${cuenta.tipo}): $${cuenta.saldo}`);
    });

    // 3. Simular eliminación (misma lógica del endpoint)
    console.log('\n🗑️ Ejecutando eliminación...');

    await prisma.$transaction(async (tx) => {
      // Lógica de reversión según el tipo de movimiento
      if (movimientoAEliminar.es_traspaso) {
        // Para TRASPASOS: revertir ambas cuentas
        if (movimientoAEliminar.cuenta_origen_id) {
          await tx.cuenta.update({
            where: { id: movimientoAEliminar.cuenta_origen_id },
            data: {
              saldo_actual: {
                increment: Number(movimientoAEliminar.monto) // Devolver dinero a cuenta origen
              }
            }
          });
          console.log(`   ↩️ Devuelto $${movimientoAEliminar.monto} a cuenta origen`);
        }
        if (movimientoAEliminar.cuenta_destino_id) {
          await tx.cuenta.update({
            where: { id: movimientoAEliminar.cuenta_destino_id },
            data: {
              saldo_actual: {
                decrement: Number(movimientoAEliminar.monto) // Quitar dinero de cuenta destino
              }
            }
          });
          console.log(`   ↩️ Quitado $${movimientoAEliminar.monto} de cuenta destino`);
        }
      } else {
        // Para INGRESOS/EGRESOS: revertir la cuenta afectada
        if (movimientoAEliminar.es_ingreso && movimientoAEliminar.cuenta_destino_id) {
          // Revertir ingreso: quitar dinero de cuenta destino
          await tx.cuenta.update({
            where: { id: movimientoAEliminar.cuenta_destino_id },
            data: {
              saldo_actual: {
                decrement: Number(movimientoAEliminar.monto)
              }
            }
          });
          console.log(`   ↩️ Revertido INGRESO: quitado $${movimientoAEliminar.monto} de cuenta destino`);
        } else if (!movimientoAEliminar.es_ingreso && movimientoAEliminar.cuenta_origen_id) {
          // Revertir egreso: devolver dinero a cuenta origen
          await tx.cuenta.update({
            where: { id: movimientoAEliminar.cuenta_origen_id },
            data: {
              saldo_actual: {
                increment: Number(movimientoAEliminar.monto)
              }
            }
          });
          console.log(`   ↩️ Revertido EGRESO: devuelto $${movimientoAEliminar.monto} a cuenta origen`);
        }
      }

      // Eliminar el movimiento
      await tx.movimiento.delete({
        where: { id: movimientoAEliminar.id }
      });

      console.log(`   🗑️ Movimiento [${movimientoAEliminar.id}] eliminado de base de datos`);
    });

    // 4. Mostrar saldos después
    console.log('\n💰 Saldos DESPUÉS de eliminar:');
    for (const cuentaAntes of saldosAntes) {
      const cuentaDespues = await prisma.cuenta.findUnique({ where: { id: cuentaAntes.id } });
      const diferencia = Number(cuentaDespues.saldo_actual) - Number(cuentaAntes.saldo);
      console.log(`   ${cuentaDespues.nombre} (${cuentaAntes.tipo}): $${cuentaDespues.saldo_actual} (${diferencia >= 0 ? '+' : ''}${diferencia})`);
    }

    // 5. Verificar que el movimiento fue eliminado
    const movimientoEliminado = await prisma.movimiento.findUnique({
      where: { id: movimientoAEliminar.id }
    });

    if (movimientoEliminado) {
      console.log('\n❌ ERROR: El movimiento aún existe en la base de datos');
    } else {
      console.log('\n✅ Movimiento eliminado correctamente de la base de datos');
    }

    // 6. Contar movimientos restantes
    const movimientosRestantes = await prisma.movimiento.count();
    console.log(`\n📊 Movimientos restantes: ${movimientosRestantes}`);

  } catch (error) {
    console.error('❌ Error en la prueba de eliminación:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Prueba de eliminación completada!');
}

probarEliminacion();