// Script para probar la nueva funcionalidad de traspasos con Prisma
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function probarTraspasos() {
  try {
    console.log('🧪 Probando nueva funcionalidad de TRASPASOS...\n');

    // 1. Obtener las cuentas disponibles
    console.log('1. 📊 Obteniendo cuentas disponibles...');
    const cuentas = await prisma.cuenta.findMany({
      where: { activa: true },
      orderBy: { tipo_cuenta: 'asc' }
    });

    console.log('✅ Cuentas encontradas:');
    cuentas.forEach(cuenta => {
      console.log(`   - [${cuenta.id}] ${cuenta.nombre} (${cuenta.tipo_cuenta}) - Saldo: $${cuenta.saldo_actual}`);
    });

    // 2. Crear un traspaso de prueba
    const cuentaOrigen = cuentas.find(c => c.tipo_cuenta === 'cajera');
    const cuentaDestino = cuentas.find(c => c.tipo_cuenta === 'contadora');

    if (cuentaOrigen && cuentaDestino) {
      console.log(`\n2. 💸 Creando traspaso de prueba:`);
      console.log(`   Origen: ${cuentaOrigen.nombre} [${cuentaOrigen.id}]`);
      console.log(`   Destino: ${cuentaDestino.nombre} [${cuentaDestino.id}]`);
      console.log(`   Monto: $500.00`);

      // Usar transacción como en la API
      const resultado = await prisma.$transaction(async (tx) => {
        // Crear movimiento de traspaso
        const nuevoMovimiento = await tx.movimiento.create({
          data: {
            tipo_movimiento: 'retiro_parcial',
            es_ingreso: true, // Se ignora para traspasos
            es_traspaso: true,
            monto: 500,
            cuenta_origen_id: cuentaOrigen.id,
            cuenta_destino_id: cuentaDestino.id,
            empresa_id: 1,
            referencia: 'Traspaso de prueba - Retiro parcial por seguridad'
          }
        });

        // Actualizar saldos
        await tx.cuenta.update({
          where: { id: cuentaOrigen.id },
          data: {
            saldo_actual: {
              decrement: 500
            }
          }
        });

        await tx.cuenta.update({
          where: { id: cuentaDestino.id },
          data: {
            saldo_actual: {
              increment: 500
            }
          }
        });

        return nuevoMovimiento;
      });

      console.log('✅ Traspaso creado exitosamente!');
      console.log(`   ID del movimiento: ${resultado.id}`);
      console.log(`   Tipo: ${resultado.tipo_movimiento}`);
      console.log(`   Es traspaso: ${resultado.es_traspaso}`);
      console.log(`   Monto: $${resultado.monto}`);

      // 3. Verificar saldos actualizados
      console.log('\n3. 🔍 Verificando saldos actualizados...');
      const cuentasUpdated = await prisma.cuenta.findMany({
        where: { activa: true },
        orderBy: { tipo_cuenta: 'asc' }
      });

      const origenUpdated = cuentasUpdated.find(c => c.id === cuentaOrigen.id);
      const destinoUpdated = cuentasUpdated.find(c => c.id === cuentaDestino.id);

      console.log('   Saldos después del traspaso:');
      console.log(`   - ${origenUpdated.nombre}: $${origenUpdated.saldo_actual} (antes: $${cuentaOrigen.saldo_actual})`);
      console.log(`   - ${destinoUpdated.nombre}: $${destinoUpdated.saldo_actual} (antes: $${cuentaDestino.saldo_actual})`);

    } else {
      console.log('❌ No se encontraron cuentas cajera y contadora para hacer la prueba');
    }

    // 4. Listar todos los traspasos
    console.log('\n4. 📋 Listando todos los traspasos...');
    const traspasos = await prisma.movimiento.findMany({
      where: { es_traspaso: true },
      include: {
        cuenta_origen: { select: { nombre: true } },
        cuenta_destino: { select: { nombre: true } }
      }
    });

    console.log(`✅ Total de traspasos: ${traspasos.length}`);
    traspasos.forEach(mov => {
      console.log(`   - [${mov.id}] ${mov.tipo_movimiento}: $${mov.monto} (${mov.cuenta_origen?.nombre} → ${mov.cuenta_destino?.nombre})`);
    });

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Prueba de traspasos completada!');
}

probarTraspasos();