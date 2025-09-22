// Script para probar las nuevas APIs
const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3000'

async function testEmpleadosAPI() {
  console.log('🧪 Probando API de empleados...\n')

  try {
    // 1. GET /api/empleados
    console.log('📋 GET /api/empleados')
    const response = await fetch(`${BASE_URL}/api/empleados`)

    if (!response.ok) {
      console.log(`❌ Error: ${response.status} ${response.statusText}`)
      const error = await response.text()
      console.log('Error detail:', error)
      return
    }

    const data = await response.json()
    console.log(`✅ Respuesta exitosa: ${data.empleados.length} empleados encontrados`)

    data.empleados.forEach(emp => {
      console.log(`   • ${emp.nombre} (${emp.puesto}) - ID: ${emp.id}`)
    })

    // 2. GET /api/empleados/[id]
    if (data.empleados.length > 0) {
      const empleadoId = data.empleados[0].id
      console.log(`\n👤 GET /api/empleados/${empleadoId}`)

      const empleadoResponse = await fetch(`${BASE_URL}/api/empleados/${empleadoId}`)

      if (empleadoResponse.ok) {
        const empleadoData = await empleadoResponse.json()
        console.log(`✅ Empleado encontrado: ${empleadoData.empleado.nombre}`)
        console.log(`   Cortes: ${empleadoData.empleado._count.cortes}`)
        console.log(`   Movimientos: ${empleadoData.empleado._count.movimientos_empleado}`)
      } else {
        console.log(`❌ Error al obtener empleado: ${empleadoResponse.status}`)
      }
    }

  } catch (error) {
    console.error('❌ Error en prueba:', error.message)
  }
}

async function testEntidadesAPI() {
  console.log('\n🧪 Probando API de entidades...\n')

  try {
    // 1. GET /api/entidades
    console.log('📋 GET /api/entidades')
    const response = await fetch(`${BASE_URL}/api/entidades`)

    if (!response.ok) {
      console.log(`❌ Error: ${response.status} ${response.statusText}`)
      const error = await response.text()
      console.log('Error detail:', error)
      return
    }

    const data = await response.json()
    console.log(`✅ Respuesta exitosa: ${data.entidades.length} entidades encontradas`)

    data.entidades.forEach(ent => {
      const tipos = []
      if (ent.es_empleado) tipos.push('Empleado')
      if (ent.es_cliente) tipos.push('Cliente')
      if (ent.es_proveedor) tipos.push('Proveedor')

      console.log(`   • ${ent.nombre} (${tipos.join(', ')}) - ID: ${ent.id}`)
    })

    // 2. GET /api/entidades?tipo=empleado
    console.log('\n👥 GET /api/entidades?tipo=empleado')
    const empleadosResponse = await fetch(`${BASE_URL}/api/entidades?tipo=empleado`)

    if (empleadosResponse.ok) {
      const empleadosData = await empleadosResponse.json()
      console.log(`✅ Empleados encontrados: ${empleadosData.entidades.length}`)
    } else {
      console.log(`❌ Error al filtrar empleados: ${empleadosResponse.status}`)
    }

    // 3. GET /api/entidades?tipo=cliente
    console.log('\n🏪 GET /api/entidades?tipo=cliente')
    const clientesResponse = await fetch(`${BASE_URL}/api/entidades?tipo=cliente`)

    if (clientesResponse.ok) {
      const clientesData = await clientesResponse.json()
      console.log(`✅ Clientes encontrados: ${clientesData.entidades.length}`)
    } else {
      console.log(`❌ Error al filtrar clientes: ${clientesResponse.status}`)
    }

  } catch (error) {
    console.error('❌ Error en prueba:', error.message)
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando pruebas de APIs actualizadas...\n')

  await testEmpleadosAPI()
  await testEntidadesAPI()

  console.log('\n✅ Pruebas completadas!')
}

runAllTests()