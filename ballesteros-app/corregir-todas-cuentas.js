const { PrismaClient } = require('@prisma/client');

async function corregirTodasCuentas() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Corrigiendo estructura de todas las cuentas...\n');

    // 1. Corregir Cajera Carnicería
    const carniceria = await prisma.cuenta.findFirst({
      where: { nombre: 'Cajera Carnicería' }
    });

    if (carniceria && carniceria.tipo_cuenta !== 'cajera') {
      await prisma.cuenta.update({
        where: { id: carniceria.id },
        data: {
          tipo_cuenta: 'cajera',
          descripcion: 'Operaciones diarias Principal'
        }
      });
      console.log(`✅ Corregido: Cajera Carnicería → tipo 'cajera'`);
    }

    // 2. Verificar que Carlos sea fiscal
    const carlos = await prisma.cuenta.findFirst({
      where: { nombre: 'Caja Carlos' }
    });

    if (carlos && carlos.tipo_cuenta !== 'fiscal') {
      await prisma.cuenta.update({
        where: { id: carlos.id },
        data: {
          tipo_cuenta: 'fiscal',
          descripcion: 'Cuenta fiscal del dueño'
        }
      });
      console.log(`✅ Corregido: Caja Carlos → tipo 'fiscal'`);
    }

    // 3. Mostrar estructura corregida
    console.log('\n💰 Estructura corregida de cuentas:');
    const todasCuentas = await prisma.cuenta.findMany({
      where: { activa: true },
      orderBy: [
        { tipo_cuenta: 'asc' },
        { empresa_asociada: 'asc' },
        { nombre: 'asc' }
      ]
    });

    // Agrupar por tipo
    const cajeras = todasCuentas.filter(c => c.tipo_cuenta === 'cajera');
    const contadora = todasCuentas.filter(c => c.tipo_cuenta === 'contadora');
    const fiscal = todasCuentas.filter(c => c.tipo_cuenta === 'fiscal');

    console.log('\n--- CUENTAS CAJERAS (Para ventas en efectivo) ---');
    cajeras.forEach(cuenta => {
      console.log(`   - [${cuenta.id}] ${cuenta.nombre} (${cuenta.empresa_asociada || 'General'}) - $${cuenta.saldo_actual}`);
    });

    console.log('\n--- CUENTA CONTADORA ---');
    contadora.forEach(cuenta => {
      console.log(`   - [${cuenta.id}] ${cuenta.nombre} - $${cuenta.saldo_actual}`);
    });

    console.log('\n--- CUENTAS FISCALES ---');
    fiscal.forEach(cuenta => {
      console.log(`   - [${cuenta.id}] ${cuenta.nombre} - $${cuenta.saldo_actual}`);
    });

    // 4. Resumen para el formulario
    console.log('\n📝 Resumen para formularios:');
    console.log(`   Cuentas CAJERAS disponibles: ${cajeras.length} (para ventas en efectivo)`);
    console.log(`   Cuentas FISCALES disponibles: ${fiscal.length} (para pagos grandes)`);
    console.log(`   Cuenta CONTADORA: ${contadora.length} (para consolidación)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Corrección completada!');
}

corregirTodasCuentas();