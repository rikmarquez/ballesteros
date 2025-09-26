const { PrismaClient } = require('@prisma/client');

async function probarCobranza() {
  const prisma = new PrismaClient();

  try {
    console.log('🧪 Probando funcionalidad completa de COBRANZA...\n');

    // 1. Crear un cliente de prueba si no existe
    console.log('👤 Verificando cliente de prueba...');
    let cliente = await prisma.entidad.findFirst({
      where: {
        nombre: 'Cliente Test',
        es_cliente: true
      }
    });

    if (!cliente) {
      cliente = await prisma.entidad.create({
        data: {
          nombre: 'Cliente Test',
          es_cliente: true,
          activo: true
        }
      });
      console.log(`   ✅ Cliente creado: ${cliente.nombre} [ID: ${cliente.id}]`);
    } else {
      console.log(`   ✅ Cliente existente: ${cliente.nombre} [ID: ${cliente.id}]`);
    }

    // 2. Verificar saldo inicial del cliente
    console.log('\n💰 Verificando saldo inicial del cliente...');
    const saldoAntes = await prisma.saldo.findFirst({
      where: {
        entidad_id: cliente.id,
        empresa_id: 1,
        tipo_saldo: 'general'
      }
    });

    console.log(`   Saldo antes: ${saldoAntes ? `$${saldoAntes.saldo_actual}` : 'Sin saldo registrado'}`);

    // 3. Simular una venta a crédito primero (para tener algo que cobrar)
    console.log('\n🛍️ Creando una venta a crédito de $500...');
    const ventaCredito = await prisma.$transaction(async (tx) => {
      const movimiento = await tx.movimiento.create({
        data: {
          tipo_movimiento: 'venta_credito',
          es_ingreso: true,
          es_traspaso: false,
          monto: 500.00,
          fecha: new Date(),
          empresa_id: 1,
          entidad_relacionada_id: cliente.id,
          referencia: 'Venta a crédito - Test'
        }
      });

      // Actualizar saldo del cliente (aumentar deuda)
      await tx.saldo.upsert({
        where: {
          entidad_id_empresa_id_tipo_saldo: {
            entidad_id: cliente.id,
            empresa_id: 1,
            tipo_saldo: 'general'
          }
        },
        update: {
          total_cargos: { increment: 500.00 },
          saldo_actual: { increment: 500.00 },
          ultima_actualizacion: new Date()
        },
        create: {
          entidad_id: cliente.id,
          empresa_id: 1,
          tipo_saldo: 'general',
          saldo_inicial: 0,
          total_cargos: 500.00,
          total_abonos: 0,
          saldo_actual: 500.00,
          ultima_actualizacion: new Date()
        }
      });

      return movimiento;
    });

    console.log(`   ✅ Venta a crédito creada: ID ${ventaCredito.id}`);

    // 4. Verificar saldo después de la venta a crédito
    const saldoDespuesVenta = await prisma.saldo.findFirst({
      where: {
        entidad_id: cliente.id,
        empresa_id: 1,
        tipo_saldo: 'general'
      }
    });

    console.log(`   Nuevo saldo del cliente: $${saldoDespuesVenta.saldo_actual}`);

    // 5. Ahora probar la cobranza
    console.log('\n💵 Registrando cobranza de $200...');
    const cobranza = await prisma.$transaction(async (tx) => {
      // Crear movimiento de cobranza
      const movimiento = await tx.movimiento.create({
        data: {
          tipo_movimiento: 'cobranza',
          es_ingreso: true,
          es_traspaso: false,
          monto: 200.00,
          fecha: new Date(),
          empresa_id: 1,
          cuenta_destino_id: 19, // Cajera Carnicería
          entidad_relacionada_id: cliente.id,
          referencia: 'Cobranza parcial - Test'
        }
      });

      // Actualizar saldo de la cajera (aumentar efectivo)
      await tx.cuenta.update({
        where: { id: 19 },
        data: {
          saldo_actual: { increment: 200.00 }
        }
      });

      // Actualizar saldo del cliente (disminuir deuda)
      await tx.saldo.update({
        where: {
          entidad_id_empresa_id_tipo_saldo: {
            entidad_id: cliente.id,
            empresa_id: 1,
            tipo_saldo: 'general'
          }
        },
        data: {
          total_abonos: { increment: 200.00 },
          saldo_actual: { decrement: 200.00 }, // Menos deuda
          ultima_actualizacion: new Date()
        }
      });

      return movimiento;
    });

    console.log(`   ✅ Cobranza registrada: ID ${cobranza.id}`);

    // 6. Verificar resultados finales
    console.log('\n📊 Verificando resultados finales...');

    const saldoFinal = await prisma.saldo.findFirst({
      where: {
        entidad_id: cliente.id,
        empresa_id: 1,
        tipo_saldo: 'general'
      }
    });

    const cuentaCajera = await prisma.cuenta.findUnique({
      where: { id: 19 },
      select: { nombre: true, saldo_actual: true }
    });

    console.log('\n✅ RESUMEN FINAL:');
    console.log(`   Cliente: ${cliente.nombre}`);
    console.log(`   Saldo pendiente: $${saldoFinal.saldo_actual}`);
    console.log(`   Total cargos: $${saldoFinal.total_cargos}`);
    console.log(`   Total abonos: $${saldoFinal.total_abonos}`);
    console.log(`   Cuenta cajera: ${cuentaCajera.nombre} - $${cuentaCajera.saldo_actual}`);

    // 7. Probar consulta de entidades con saldo
    console.log('\n🔍 Probando endpoint de entidades con saldos...');
    const entidades = await prisma.entidad.findMany({
      where: { es_cliente: true },
      include: {
        saldos: {
          select: {
            empresa_id: true,
            tipo_saldo: true,
            saldo_actual: true
          }
        }
      },
      take: 3
    });

    console.log('\n👥 Clientes con saldos:');
    entidades.forEach(entidad => {
      const saldoTotal = entidad.saldos.reduce((total, saldo) =>
        total + Number(saldo.saldo_actual || 0), 0
      );
      console.log(`   ${entidad.nombre}: $${saldoTotal.toFixed(2)}`);
    });

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Prueba de cobranza completada!');
}

probarCobranza();