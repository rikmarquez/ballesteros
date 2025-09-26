const { PrismaClient } = require('@prisma/client');

async function verificarCajeras() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Verificando cajeras disponibles...\n');

    // 1. Verificar empleados con permisos de caja
    const cajeras = await prisma.entidad.findMany({
      where: {
        es_empleado: true,
        puede_operar_caja: true,
        activo: true
      }
    });

    console.log('👥 Empleados cajeras:');
    if (cajeras.length === 0) {
      console.log('❌ No hay empleados con permisos de caja');

      // Crear una cajera de prueba
      console.log('\n🔧 Creando cajera de prueba...');
      const nuevaCajera = await prisma.entidad.create({
        data: {
          nombre: 'María García',
          es_empleado: true,
          puesto: 'Cajera Principal',
          puede_operar_caja: true,
          activo: true
        }
      });
      console.log(`✅ Cajera creada: ${nuevaCajera.nombre} [${nuevaCajera.id}]`);

      // Asignarla a empresas
      await prisma.entidadEmpresa.createMany({
        data: [
          {
            entidad_id: nuevaCajera.id,
            empresa_id: 1,
            tipo_relacion: 'empleado',
            activo: true
          },
          {
            entidad_id: nuevaCajera.id,
            empresa_id: 2,
            tipo_relacion: 'empleado',
            activo: true
          },
          {
            entidad_id: nuevaCajera.id,
            empresa_id: 3,
            tipo_relacion: 'empleado',
            activo: true
          }
        ]
      });
      console.log('✅ Cajera asignada a todas las empresas');

    } else {
      cajeras.forEach(cajera => {
        console.log(`   - [${cajera.id}] ${cajera.nombre} - ${cajera.puesto}`);
      });
    }

    // 2. Verificar cuentas de cajeras
    console.log('\n💰 Cuentas de cajeras disponibles:');
    const cuentasCajeras = await prisma.cuenta.findMany({
      where: {
        tipo_cuenta: 'cajera',
        activa: true
      },
      orderBy: { nombre: 'asc' }
    });

    cuentasCajeras.forEach(cuenta => {
      console.log(`   - [${cuenta.id}] ${cuenta.nombre} (${cuenta.empresa_asociada || 'General'}) - Saldo: $${cuenta.saldo_actual}`);
    });

    // 3. Verificar empresas
    console.log('\n🏢 Empresas disponibles:');
    const empresas = await prisma.empresa.findMany({
      where: { activa: true }
    });

    empresas.forEach(empresa => {
      console.log(`   - [${empresa.id}] ${empresa.nombre}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n✅ Verificación completada');
}

verificarCajeras();