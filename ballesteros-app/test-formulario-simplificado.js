const { PrismaClient } = require('@prisma/client');

async function probarFormularioSimplificado() {
  const prisma = new PrismaClient();

  try {
    console.log('🧪 Probando formulario simplificado de VENTA EN EFECTIVO...\n');

    // Simular empresa activa = 1 (localStorage)
    const empresaActiva = 1;

    console.log('🏢 Empresa activa:', empresaActiva);

    // 1. Obtener empresa activa
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaActiva }
    });
    console.log(`   - ${empresa.nombre}`);

    // 2. Obtener cuentas filtradas por empresa activa
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

    console.log(`\n💰 Cuentas disponibles para ${empresa.nombre}:`);
    cuentas.forEach(cuenta => {
      console.log(`   - [${cuenta.id}] ${cuenta.nombre} - Saldo: $${cuenta.saldo_actual}`);
    });

    // 3. Simular envío del formulario simplificado
    const ventaSimplificada = {
      tipo_movimiento: 'venta_efectivo',
      es_ingreso: true,
      es_traspaso: false,
      monto: 2500.75,
      fecha: new Date().toISOString(),
      empresa_id: empresaActiva,
      cuenta_destino_id: cuentas[0]?.id, // Primera cuenta disponible
      referencia: 'María García - Venta mostrador tarde'
    };

    console.log(`\n📝 Simulando venta simplificada:`);
    console.log(`   Monto: $${ventaSimplificada.monto}`);
    console.log(`   Empresa: ${empresa.nombre} (auto-asignada)`);
    console.log(`   Cuenta: ${cuentas[0]?.nombre}`);
    console.log(`   Referencia: ${ventaSimplificada.referencia}`);

    // Obtener saldo anterior
    const cuentaAntes = await prisma.cuenta.findUnique({
      where: { id: ventaSimplificada.cuenta_destino_id }
    });
    console.log(`   Saldo anterior: $${cuentaAntes.saldo_actual}`);

    // 4. Crear la venta (transacción como la API)
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear movimiento
      const nuevoMovimiento = await tx.movimiento.create({
        data: ventaSimplificada,
        include: {
          cuenta_destino: { select: { nombre: true } },
          empresa: { select: { nombre: true } }
        }
      });

      // Actualizar saldo
      await tx.cuenta.update({
        where: { id: ventaSimplificada.cuenta_destino_id },
        data: {
          saldo_actual: {
            increment: ventaSimplificada.monto
          }
        }
      });

      return nuevoMovimiento;
    });

    console.log('\n✅ Venta simplificada registrada exitosamente!');
    console.log(`   ID: ${resultado.id}`);
    console.log(`   Empresa auto-asignada: ${resultado.empresa?.nombre}`);

    // Verificar saldo nuevo
    const cuentaDespues = await prisma.cuenta.findUnique({
      where: { id: ventaSimplificada.cuenta_destino_id }
    });
    console.log(`   Nuevo saldo: $${cuentaDespues.saldo_actual}`);
    console.log(`   Incremento: $${Number(cuentaDespues.saldo_actual) - Number(cuentaAntes.saldo_actual)}`);

    // 5. Verificar que funciona el filtrado por empresa
    console.log('\n🔍 Verificando filtrado por empresa...');
    const ventasPorEmpresa = await prisma.movimiento.count({
      where: {
        tipo_movimiento: 'venta_efectivo',
        empresa_id: empresaActiva
      }
    });
    console.log(`   Ventas en ${empresa.nombre}: ${ventasPorEmpresa}`);

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Prueba de formulario simplificado completada!');
}

probarFormularioSimplificado();