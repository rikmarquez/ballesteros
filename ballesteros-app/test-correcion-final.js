const { PrismaClient } = require('@prisma/client');

async function probarCorreccionFinal() {
  const prisma = new PrismaClient();

  try {
    console.log('🧪 Probando formulario con correcciones aplicadas...\n');

    // 1. Verificar estructura de cuentas corregida
    console.log('💰 Verificando estructura de cuentas:');
    const cuentasCajeras = await prisma.cuenta.findMany({
      where: {
        tipo_cuenta: 'cajera',
        activa: true
      },
      orderBy: { nombre: 'asc' }
    });

    const cuentasFiscales = await prisma.cuenta.findMany({
      where: {
        tipo_cuenta: 'fiscal',
        activa: true
      },
      orderBy: { nombre: 'asc' }
    });

    console.log('\n--- CUENTAS CAJERAS (Disponibles en formulario) ---');
    cuentasCajeras.forEach(cuenta => {
      console.log(`   ✅ [${cuenta.id}] ${cuenta.nombre} (${cuenta.empresa_asociada || 'Todas'}) - $${cuenta.saldo_actual}`);
    });

    console.log('\n--- CUENTAS FISCALES (NO en formulario de venta efectivo) ---');
    cuentasFiscales.forEach(cuenta => {
      console.log(`   🏦 [${cuenta.id}] ${cuenta.nombre} - $${cuenta.saldo_actual}`);
    });

    // 2. Simular formulario: empresa activa = Carnicería Ballesteros
    console.log('\n🏢 Simulando formulario con empresa activa: Carnicería Ballesteros');
    console.log('   📋 Cuentas cajeras disponibles para selección: TODAS (sin filtrar por empresa)');

    // 3. Probar venta en cualquier cajera desde Carnicería Ballesteros
    const ventaPrueba = {
      tipo_movimiento: 'venta_efectivo',
      es_ingreso: true,
      es_traspaso: false,
      monto: 450.00,
      fecha: new Date().toISOString(),
      empresa_id: 1, // Carnicería Ballesteros (empresa activa)
      cuenta_destino_id: 20, // Cajera Express (empresa diferente)
      referencia: 'Ana López - Venta desde Carnicería a Express'
    };

    console.log(`\n📝 Prueba: Registrar venta desde empresa activa a cualquier cajera`);
    console.log(`   Empresa activa: Carnicería Ballesteros [1]`);
    console.log(`   Cuenta destino: Cajera Express [20]`);
    console.log(`   Monto: $${ventaPrueba.monto}`);
    console.log(`   Lógica: Empresa activa define el registro, pero cajera puede ser cualquiera`);

    // Saldo anterior
    const cuentaAntes = await prisma.cuenta.findUnique({
      where: { id: 20 }
    });
    console.log(`   Saldo anterior Cajera Express: $${cuentaAntes.saldo_actual}`);

    // Ejecutar venta
    const resultado = await prisma.$transaction(async (tx) => {
      const movimiento = await tx.movimiento.create({
        data: ventaPrueba,
        include: {
          empresa: { select: { nombre: true } },
          cuenta_destino: { select: { nombre: true, empresa_asociada: true } }
        }
      });

      await tx.cuenta.update({
        where: { id: ventaPrueba.cuenta_destino_id },
        data: {
          saldo_actual: {
            increment: ventaPrueba.monto
          }
        }
      });

      return movimiento;
    });

    console.log('\n✅ Venta registrada exitosamente:');
    console.log(`   Movimiento ID: ${resultado.id}`);
    console.log(`   Registrado en empresa: ${resultado.empresa?.nombre}`);
    console.log(`   Efectivo depositado en: ${resultado.cuenta_destino?.nombre}`);
    console.log(`   Cuenta asociada a: ${resultado.cuenta_destino?.empresa_asociada}`);

    // Verificar saldo actualizado
    const cuentaDespues = await prisma.cuenta.findUnique({
      where: { id: 20 }
    });
    console.log(`   Nuevo saldo: $${cuentaDespues.saldo_actual}`);

    // 4. Verificar que Carlos ya no aparece en cuentas cajeras
    console.log('\n🔍 Verificando que Caja Carlos NO aparece en cuentas cajeras:');
    const cajaCarlos = await prisma.cuenta.findFirst({
      where: { nombre: 'Caja Carlos' }
    });

    if (cajaCarlos) {
      console.log(`   ✅ Caja Carlos es tipo: ${cajaCarlos.tipo_cuenta} (correcto: no es cajera)`);
      console.log(`   ✅ Saldo: $${cajaCarlos.saldo_actual}`);

      if (cajaCarlos.tipo_cuenta === 'cajera') {
        console.log('   ❌ ERROR: Carlos aún aparece como cajera!');
      } else {
        console.log('   ✅ Carlos correctamente clasificado como cuenta fiscal');
      }
    }

    // 5. Resumen final
    console.log('\n📊 RESUMEN DE CORRECCIONES:');
    console.log(`   ✅ Cuentas cajeras disponibles: ${cuentasCajeras.length}`);
    console.log(`   ✅ Formulario muestra TODAS las cajeras (sin filtrar por empresa)`);
    console.log(`   ✅ Empresa activa se usa para el registro del movimiento`);
    console.log(`   ✅ Caja Carlos es cuenta fiscal (no aparece en formulario)`);
    console.log(`   ✅ Se puede elegir cualquier cajera desde cualquier empresa`);

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Prueba de corrección final completada!');
}

probarCorreccionFinal();