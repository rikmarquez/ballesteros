const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function limpiarProveedoresDuplicados() {
  try {
    console.log('🔍 Analizando proveedores duplicados...')

    // Obtener todos los proveedores con sus relaciones
    const proveedores = await prisma.entidad.findMany({
      where: {
        es_proveedor: true
      },
      include: {
        entidades_empresas: true,
        movimientos_entidad: true,
        saldos: true
      },
      orderBy: [
        { nombre: 'asc' },
        { created_at: 'asc' }
      ]
    })

    console.log(`📊 Total proveedores encontrados: ${proveedores.length}`)

    // Agrupar por nombre (case insensitive)
    const grupos = {}
    proveedores.forEach(proveedor => {
      const nombreKey = proveedor.nombre.toLowerCase().trim()
      if (!grupos[nombreKey]) {
        grupos[nombreKey] = []
      }
      grupos[nombreKey].push(proveedor)
    })

    // Identificar duplicados
    const duplicados = Object.entries(grupos).filter(([nombre, lista]) => lista.length > 1)

    console.log(`🔄 Grupos con duplicados: ${duplicados.length}`)

    let totalEliminados = 0

    for (const [nombreKey, lista] of duplicados) {
      console.log(`\n📝 Procesando: "${lista[0].nombre}" (${lista.length} registros)`)

      // Mantener el más antiguo (primer registro creado)
      const mantener = lista[0]
      const eliminar = lista.slice(1)

      console.log(`   ✅ Mantener: ID ${mantener.id} (${mantener.created_at})`)

      for (const duplicado of eliminar) {
        console.log(`   🗑️  Eliminar: ID ${duplicado.id} (${duplicado.created_at})`)

        // Verificar si tiene movimientos o saldos
        const tieneMovimientos = duplicado.movimientos_entidad.length > 0
        const tieneSaldos = duplicado.saldos.length > 0

        if (tieneMovimientos || tieneSaldos) {
          console.log(`   ⚠️  ADVERTENCIA: Tiene ${duplicado.movimientos_entidad.length} movimientos y ${duplicado.saldos.length} saldos`)
          console.log(`   🔄 Transfiriendo relaciones a ID ${mantener.id}...`)

          // Transferir movimientos
          if (tieneMovimientos) {
            await prisma.movimiento.updateMany({
              where: { entidad_relacionada_id: duplicado.id },
              data: { entidad_relacionada_id: mantener.id }
            })
          }

          // Transferir saldos (consolidar si es necesario)
          if (tieneSaldos) {
            for (const saldo of duplicado.saldos) {
              // Buscar si ya existe un saldo para la misma empresa y tipo
              const saldoExistente = await prisma.saldo.findFirst({
                where: {
                  entidad_id: mantener.id,
                  empresa_id: saldo.empresa_id,
                  tipo_saldo: saldo.tipo_saldo
                }
              })

              if (saldoExistente) {
                // Consolidar saldos
                await prisma.saldo.update({
                  where: { id: saldoExistente.id },
                  data: {
                    saldo_inicial: saldoExistente.saldo_inicial + saldo.saldo_inicial,
                    total_cargos: saldoExistente.total_cargos + saldo.total_cargos,
                    total_abonos: saldoExistente.total_abonos + saldo.total_abonos,
                    saldo_actual: saldoExistente.saldo_actual + saldo.saldo_actual
                  }
                })
                console.log(`   💰 Saldo consolidado para empresa ${saldo.empresa_id}`)
              } else {
                // Transferir saldo
                await prisma.saldo.update({
                  where: { id: saldo.id },
                  data: { entidad_id: mantener.id }
                })
                console.log(`   💰 Saldo transferido para empresa ${saldo.empresa_id}`)
              }
            }
          }
        }

        // Eliminar relaciones empresa-entidad duplicadas
        await prisma.entidadEmpresa.deleteMany({
          where: { entidad_id: duplicado.id }
        })

        // Eliminar saldos restantes
        await prisma.saldo.deleteMany({
          where: { entidad_id: duplicado.id }
        })

        // Eliminar el proveedor duplicado
        await prisma.entidad.delete({
          where: { id: duplicado.id }
        })

        console.log(`   ✅ Eliminado: ID ${duplicado.id}`)
        totalEliminados++
      }
    }

    console.log(`\n🎉 Limpieza completada:`)
    console.log(`   📊 Total proveedores eliminados: ${totalEliminados}`)
    console.log(`   ✅ Proveedores únicos restantes: ${proveedores.length - totalEliminados}`)

    // Verificación final
    const proveedoresFinales = await prisma.entidad.findMany({
      where: { es_proveedor: true },
      select: { id: true, nombre: true }
    })

    console.log(`\n📋 Proveedores finales:`)
    proveedoresFinales.forEach(p => {
      console.log(`   - ${p.nombre} (ID: ${p.id})`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

limpiarProveedoresDuplicados()