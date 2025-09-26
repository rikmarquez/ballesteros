const { PrismaClient } = require('@prisma/client');

async function probarCambioEmpresa() {
  const prisma = new PrismaClient();

  try {
    console.log('🧪 Probando cambio dinámico de empresa...\n');

    // 1. Obtener todas las empresas disponibles
    const empresas = await prisma.empresa.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' }
    });

    console.log('🏢 Empresas disponibles:');
    empresas.forEach(empresa => {
      console.log(`   - [${empresa.id}] ${empresa.nombre}`);
    });

    // 2. Probar filtrado de cuentas por empresa
    console.log('\n💰 Probando filtrado de cuentas por empresa...');

    for (const empresa of empresas) {
      console.log(`\n--- ${empresa.nombre} ---`);

      const cuentas = await prisma.cuenta.findMany({
        where: {
          tipo_cuenta: 'cajera',
          activa: true,
          OR: [
            { empresa_asociada: empresa.nombre },
            { empresa_asociada: null }
          ]
        }
      });

      console.log(`   Cuentas disponibles: ${cuentas.length}`);
      cuentas.forEach(cuenta => {
        console.log(`     - [${cuenta.id}] ${cuenta.nombre} (${cuenta.empresa_asociada || 'General'}) - $${cuenta.saldo_actual}`);
      });

      // Solo mostrar las primeras 2 empresas para no saturar
      if (empresa.id >= 2) break;
    }

    // 3. Simular cambio de empresa y venta
    const empresaPrueba1 = empresas[0]; // Principal
    const empresaPrueba2 = empresas[1]; // Express (si existe)

    if (empresaPrueba2) {
      console.log(`\n🔄 Simulando cambio de empresa: ${empresaPrueba1.nombre} → ${empresaPrueba2.nombre}`);

      // Obtener cuentas de la nueva empresa
      const cuentasEmpresa2 = await prisma.cuenta.findMany({
        where: {
          tipo_cuenta: 'cajera',
          activa: true,
          OR: [
            { empresa_asociada: empresaPrueba2.nombre },
            { empresa_asociada: null }
          ]
        }
      });

      if (cuentasEmpresa2.length > 0) {
        console.log(`   Nueva empresa: ${empresaPrueba2.nombre}`);
        console.log(`   Cuentas disponibles: ${cuentasEmpresa2.length}`);
        console.log(`   Cuenta seleccionada: ${cuentasEmpresa2[0].nombre}`);

        // Simular venta en la nueva empresa
        const ventaEmpresa2 = {
          tipo_movimiento: 'venta_efectivo',
          es_ingreso: true,
          es_traspaso: false,
          monto: 800.25,
          fecha: new Date().toISOString(),
          empresa_id: empresaPrueba2.id,
          cuenta_destino_id: cuentasEmpresa2[0].id,
          referencia: `Venta en ${empresaPrueba2.nombre} - Ana López`
        };

        const resultado = await prisma.$transaction(async (tx) => {
          const movimiento = await tx.movimiento.create({
            data: ventaEmpresa2,
            include: {
              empresa: { select: { nombre: true } },
              cuenta_destino: { select: { nombre: true } }
            }
          });

          await tx.cuenta.update({
            where: { id: ventaEmpresa2.cuenta_destino_id },
            data: {
              saldo_actual: {
                increment: ventaEmpresa2.monto
              }
            }
          });

          return movimiento;
        });

        console.log('\n✅ Venta registrada en nueva empresa:');
        console.log(`   Movimiento ID: ${resultado.id}`);
        console.log(`   Empresa: ${resultado.empresa?.nombre}`);
        console.log(`   Cuenta: ${resultado.cuenta_destino?.nombre}`);
        console.log(`   Monto: $${resultado.monto}`);
      }
    }

    // 4. Verificar separación por empresa
    console.log('\n📊 Verificando movimientos por empresa...');
    for (const empresa of empresas.slice(0, 2)) {
      const movimientos = await prisma.movimiento.count({
        where: {
          tipo_movimiento: 'venta_efectivo',
          empresa_id: empresa.id
        }
      });
      console.log(`   ${empresa.nombre}: ${movimientos} ventas en efectivo`);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Prueba de cambio dinámico completada!');
}

probarCambioEmpresa();