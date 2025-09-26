const { PrismaClient } = require('@prisma/client');

async function probarFecha() {
  const prisma = new PrismaClient();

  try {
    console.log('🕐 Probando manejo de fechas en movimientos...\n');

    // Mostrar fecha/hora actual del sistema
    const now = new Date();
    console.log(`Fecha/hora del sistema: ${now.toString()}`);
    console.log(`Fecha/hora local (toString): ${now.toLocaleString('es-MX')}`);
    console.log(`Zona horaria: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

    // Simular lo que hace el frontend
    console.log('\n📝 Simulando formulario frontend:');
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    console.log(`Campo datetime-local: ${localISOTime}`);

    // Simular envío al backend
    console.log('\n📤 Simulando envío al backend:');
    const fechaParaEnvio = new Date(localISOTime);
    console.log(`Fecha recreada: ${fechaParaEnvio.toString()}`);
    console.log(`Fecha ISO para BD: ${fechaParaEnvio.toISOString()}`);

    // Crear un movimiento de prueba
    console.log('\n💾 Creando movimiento de prueba...');
    const movimiento = await prisma.movimiento.create({
      data: {
        tipo_movimiento: 'test_fecha',
        es_ingreso: true,
        es_traspaso: false,
        monto: 100.00,
        fecha: fechaParaEnvio, // Esta es la fecha que debe coincidir con la esperada
        empresa_id: 1,
        cuenta_destino_id: 19,
        referencia: `Prueba de fecha local - ${fechaParaEnvio.toLocaleString('es-MX')}`
      }
    });

    console.log(`✅ Movimiento creado con ID: ${movimiento.id}`);

    // Leer el movimiento y mostrar cómo se guardó
    console.log('\n🔍 Verificando cómo se guardó en la base de datos:');
    const movimientoLeido = await prisma.movimiento.findUnique({
      where: { id: movimiento.id }
    });

    console.log(`Fecha en BD (raw): ${movimientoLeido.fecha}`);
    console.log(`Fecha en BD (toString): ${movimientoLeido.fecha.toString()}`);
    console.log(`Fecha en BD (toLocaleString): ${movimientoLeido.fecha.toLocaleString('es-MX')}`);

    // Verificar diferencia
    const diferenciaMilisegundos = Math.abs(now.getTime() - movimientoLeido.fecha.getTime());
    const diferenciaMinutos = Math.round(diferenciaMilisegundos / (1000 * 60));

    console.log(`\n⏰ Diferencia temporal:`);
    console.log(`   Diferencia: ${diferenciaMinutos} minutos`);

    if (diferenciaMinutos <= 1) {
      console.log(`   ✅ CORRECTO: La fecha se guardó correctamente`);
    } else {
      console.log(`   ❌ PROBLEMA: Hay una diferencia significativa de tiempo`);
    }

    // Limpiar - eliminar el movimiento de prueba
    await prisma.movimiento.delete({
      where: { id: movimiento.id }
    });
    console.log(`🧹 Movimiento de prueba eliminado`);

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Prueba de fecha completada!');
}

probarFecha();