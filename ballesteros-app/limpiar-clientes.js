const { PrismaClient } = require('@prisma/client');

async function limpiarClientes() {
  const prisma = new PrismaClient();

  try {
    console.log('🧹 Limpiando clientes duplicados...\n');

    // 1. Mostrar clientes actuales
    console.log('👥 Clientes actuales en el sistema:');
    const clientesActuales = await prisma.entidad.findMany({
      where: { es_cliente: true },
      include: {
        saldos: true,
        movimientos_entidad: { select: { id: true } },
        _count: { select: { movimientos_entidad: true } }
      },
      orderBy: { id: 'asc' }
    });

    console.log(`📊 Total de clientes encontrados: ${clientesActuales.length}\n`);

    clientesActuales.forEach(cliente => {
      console.log(`   [${cliente.id}] ${cliente.nombre}`);
      console.log(`       📞 ${cliente.telefono || 'Sin teléfono'}`);
      console.log(`       💰 Saldos: ${cliente.saldos.length}`);
      console.log(`       📋 Movimientos: ${cliente._count.movimientos_entidad}`);
      console.log(`       📅 Creado: ${cliente.created_at}`);
      console.log('');
    });

    if (clientesActuales.length === 0) {
      console.log('✅ No hay clientes para limpiar.');
      return;
    }

    // 2. Confirmación de eliminación
    console.log('⚠️  ADVERTENCIA: Esta operación eliminará TODOS los clientes.');
    console.log('⚠️  Los movimientos y saldos asociados también se eliminarán.');
    console.log('⚠️  Esta acción NO se puede deshacer.\n');

    // Como es un script automatizado, proceder con la limpieza
    console.log('🔄 Procediendo con la limpieza automática...\n');

    // 3. Eliminar en transacción
    await prisma.$transaction(async (tx) => {
      console.log('🗑️ Eliminando saldos de clientes...');
      const saldosEliminados = await tx.saldo.deleteMany({
        where: {
          entidad: { es_cliente: true }
        }
      });
      console.log(`   ✅ ${saldosEliminados.count} saldos eliminados`);

      console.log('🗑️ Eliminando movimientos como entidad relacionada...');
      const movimientosEliminados = await tx.movimiento.updateMany({
        where: {
          entidad_relacionada: { es_cliente: true }
        },
        data: {
          entidad_relacionada_id: null
        }
      });
      console.log(`   ✅ ${movimientosEliminados.count} movimientos desvinculados`);

      console.log('🗑️ Eliminando relaciones empresa-entidad...');
      const relacionesEliminadas = await tx.entidadEmpresa.deleteMany({
        where: {
          entidad: { es_cliente: true }
        }
      });
      console.log(`   ✅ ${relacionesEliminadas.count} relaciones eliminadas`);

      console.log('🗑️ Eliminando clientes...');
      const clientesEliminados = await tx.entidad.deleteMany({
        where: { es_cliente: true }
      });
      console.log(`   ✅ ${clientesEliminados.count} clientes eliminados`);
    });

    // 4. Verificar limpieza
    console.log('\n🔍 Verificando limpieza...');
    const clientesRestantes = await prisma.entidad.count({
      where: { es_cliente: true }
    });

    if (clientesRestantes === 0) {
      console.log('✅ Limpieza completada exitosamente. No quedan clientes en el sistema.');
    } else {
      console.log(`❌ Aún quedan ${clientesRestantes} clientes. Puede haber un problema.`);
    }

    // 5. Mostrar otras entidades que quedaron (empleados, proveedores)
    console.log('\n👨‍💼 Empleados que permanecen en el sistema:');
    const empleados = await prisma.entidad.findMany({
      where: { es_empleado: true },
      select: { id: true, nombre: true, puesto: true }
    });
    empleados.forEach(emp => {
      console.log(`   [${emp.id}] ${emp.nombre} - ${emp.puesto || 'Sin puesto'}`);
    });

    console.log('\n🏭 Proveedores que permanecen en el sistema:');
    const proveedores = await prisma.entidad.findMany({
      where: { es_proveedor: true },
      select: { id: true, nombre: true, telefono: true }
    });
    proveedores.forEach(prov => {
      console.log(`   [${prov.id}] ${prov.nombre} - ${prov.telefono || 'Sin teléfono'}`);
    });

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Proceso de limpieza completado!');
}

limpiarClientes();