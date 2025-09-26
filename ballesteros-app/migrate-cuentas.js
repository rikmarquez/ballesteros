const { PrismaClient } = require('@prisma/client');

async function ejecutarMigracion() {
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Ejecutando migración de cuentas y traspasos...');

    // 1. Limpiar cuentas existentes
    await prisma.cuenta.deleteMany();
    console.log('✅ Cuentas existentes eliminadas');

    // 2. Crear las 6 cuentas específicas
    const cuentas = await prisma.cuenta.createMany({
      data: [
        // Cuentas Centralizadas
        {
          tipo_cuenta: 'contadora',
          nombre: 'Efectivo Contadora',
          descripcion: 'Efectivo consolidado de todas las sucursales',
          empresa_asociada: null,
          saldo_actual: 0
        },
        {
          tipo_cuenta: 'fiscal',
          nombre: 'Cuenta Fiscal',
          descripcion: 'Tarjetas, transferencias y pagos bancarios',
          empresa_asociada: null,
          saldo_actual: 0
        },

        // Cuentas Específicas por Cajera/Sucursal
        {
          tipo_cuenta: 'cajera',
          nombre: 'Caja Carlos',
          descripcion: 'Caja personal del dueño',
          empresa_asociada: null,
          saldo_actual: 0
        },
        {
          tipo_cuenta: 'cajera',
          nombre: 'Cajera Carnicería',
          descripcion: 'Operaciones diarias Principal',
          empresa_asociada: 'Principal',
          saldo_actual: 0
        },
        {
          tipo_cuenta: 'cajera',
          nombre: 'Cajera Express',
          descripcion: 'Operaciones diarias Express',
          empresa_asociada: 'Express',
          saldo_actual: 0
        },
        {
          tipo_cuenta: 'cajera',
          nombre: 'Cajera Asadero',
          descripcion: 'Operaciones diarias Asadero',
          empresa_asociada: 'Asadero',
          saldo_actual: 0
        }
      ]
    });

    console.log(`✅ ${cuentas.count} cuentas creadas`);

    // 3. Verificar resultado
    const cuentasCreadas = await prisma.cuenta.findMany({
      orderBy: [
        { tipo_cuenta: 'asc' },
        { empresa_asociada: 'asc' },
        { nombre: 'asc' }
      ]
    });

    console.log('✅ Cuentas disponibles:');
    cuentasCreadas.forEach(cuenta => {
      console.log(`- [${cuenta.id}] ${cuenta.nombre} (tipo: ${cuenta.tipo_cuenta}, empresa: ${cuenta.empresa_asociada || 'N/A'})`);
    });

  } catch (error) {
    console.error('❌ Error en migración:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

ejecutarMigracion();