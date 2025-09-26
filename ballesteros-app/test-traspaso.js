// Script para probar la nueva funcionalidad de traspasos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function probarTraspasos() {
  const baseURL = 'http://localhost:3000';

  try {
    console.log('🧪 Probando nueva funcionalidad de TRASPASOS...\n');

    // 1. Obtener las cuentas disponibles
    console.log('1. 📊 Obteniendo cuentas disponibles...');
    const cuentasResponse = await fetch(`${baseURL}/api/cuentas`);
    const cuentasData = await cuentasResponse.json();

    if (cuentasData.cuentas && cuentasData.cuentas.length > 0) {
      console.log('✅ Cuentas encontradas:');
      cuentasData.cuentas.forEach(cuenta => {
        console.log(`   - [${cuenta.id}] ${cuenta.nombre} (${cuenta.tipo_cuenta}) - Saldo: $${cuenta.saldo_actual}`);
      });

      // 2. Crear un traspaso de prueba
      const cuentaOrigen = cuentasData.cuentas.find(c => c.tipo_cuenta === 'cajera');
      const cuentaDestino = cuentasData.cuentas.find(c => c.tipo_cuenta === 'contadora');

      if (cuentaOrigen && cuentaDestino) {
        console.log(`\n2. 💸 Creando traspaso de prueba:`);
        console.log(`   Origen: ${cuentaOrigen.nombre} [${cuentaOrigen.id}]`);
        console.log(`   Destino: ${cuentaDestino.nombre} [${cuentaDestino.id}]`);
        console.log(`   Monto: $500.00`);

        const traspasoData = {
          tipo_movimiento: 'retiro_parcial',
          es_traspaso: true,
          monto: 500,
          cuenta_origen_id: cuentaOrigen.id,
          cuenta_destino_id: cuentaDestino.id,
          empresa_id: 1,
          referencia: 'Traspaso de prueba - Retiro parcial por seguridad'
        };

        const response = await fetch(`${baseURL}/api/movimientos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(traspasoData)
        });

        if (response.ok) {
          const resultado = await response.json();
          console.log('✅ Traspaso creado exitosamente!');
          console.log(`   ID del movimiento: ${resultado.id}`);
          console.log(`   Tipo: ${resultado.tipo_movimiento}`);
          console.log(`   Es traspaso: ${resultado.es_traspaso}`);
          console.log(`   Monto: $${resultado.monto}`);
        } else {
          const error = await response.json();
          console.log('❌ Error al crear traspaso:', error);
        }

        // 3. Verificar saldos actualizados
        console.log('\n3. 🔍 Verificando saldos actualizados...');
        const cuentasUpdatedResponse = await fetch(`${baseURL}/api/cuentas`);
        const cuentasUpdatedData = await cuentasUpdatedResponse.json();

        const origenUpdated = cuentasUpdatedData.cuentas.find(c => c.id === cuentaOrigen.id);
        const destinoUpdated = cuentasUpdatedData.cuentas.find(c => c.id === cuentaDestino.id);

        console.log('   Saldos después del traspaso:');
        console.log(`   - ${origenUpdated.nombre}: $${origenUpdated.saldo_actual} (antes: $${cuentaOrigen.saldo_actual})`);
        console.log(`   - ${destinoUpdated.nombre}: $${destinoUpdated.saldo_actual} (antes: $${cuentaDestino.saldo_actual})`);

      } else {
        console.log('❌ No se encontraron cuentas cajera y contadora para hacer la prueba');
      }
    } else {
      console.log('❌ No se encontraron cuentas en el sistema');
    }

    // 4. Probar filtro de traspasos
    console.log('\n4. 📋 Probando filtro de traspasos...');
    const movimientosResponse = await fetch(`${baseURL}/api/movimientos?es_traspaso=true`);
    const movimientosData = await movimientosResponse.json();

    if (movimientosData.movimientos) {
      console.log(`✅ Encontrados ${movimientosData.movimientos.length} traspasos`);
      movimientosData.movimientos.forEach(mov => {
        console.log(`   - [${mov.id}] ${mov.tipo_movimiento}: $${mov.monto} (${mov.cuenta_origen?.nombre} → ${mov.cuenta_destino?.nombre})`);
      });
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }

  console.log('\n🎉 Prueba de traspasos completada!');
}

probarTraspasos();