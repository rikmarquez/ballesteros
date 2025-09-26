const { PrismaClient } = require('@prisma/client');

async function corregirCuentaCarlos() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Corrigiendo tipo de cuenta de Carlos...\n');

    // 1. Verificar cuenta actual de Carlos
    const cuentaCarlos = await prisma.cuenta.findFirst({
      where: { nombre: 'Caja Carlos' }
    });

    if (cuentaCarlos) {
      console.log('📋 Cuenta Carlos actual:');
      console.log(`   ID: ${cuentaCarlos.id}`);
      console.log(`   Nombre: ${cuentaCarlos.nombre}`);
      console.log(`   Tipo actual: ${cuentaCarlos.tipo_cuenta}`);
      console.log(`   Saldo: $${cuentaCarlos.saldo_actual}`);

      // 2. Cambiar tipo de cuenta a fiscal
      const cuentaActualizada = await prisma.cuenta.update({
        where: { id: cuentaCarlos.id },
        data: {
          tipo_cuenta: 'fiscal',
          descripcion: 'Cuenta fiscal del dueño - movimientos grandes y bancarios'
        }
      });

      console.log('\n✅ Cuenta actualizada:');
      console.log(`   Nuevo tipo: ${cuentaActualizada.tipo_cuenta}`);
      console.log(`   Descripción: ${cuentaActualizada.descripcion}`);

    } else {
      console.log('❌ No se encontró la cuenta de Carlos');
    }

    // 3. Mostrar todas las cuentas actualizadas
    console.log('\n💰 Estructura actual de cuentas:');
    const todasCuentas = await prisma.cuenta.findMany({
      where: { activa: true },
      orderBy: [
        { tipo_cuenta: 'asc' },
        { empresa_asociada: 'asc' },
        { nombre: 'asc' }
      ]
    });

    console.log('\n--- CUENTAS CAJERAS ---');
    const cajeras = todasCuentas.filter(c => c.tipo_cuenta === 'cajera');
    cajeras.forEach(cuenta => {
      console.log(`   - [${cuenta.id}] ${cuenta.nombre} (${cuenta.empresa_asociada || 'General'})`);
    });

    console.log('\n--- CUENTAS CENTRALIZADAS ---');
    const centralizadas = todasCuentas.filter(c => c.tipo_cuenta !== 'cajera');
    centralizadas.forEach(cuenta => {
      console.log(`   - [${cuenta.id}] ${cuenta.nombre} (${cuenta.tipo_cuenta})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Corrección completada!');
}

corregirCuentaCarlos();