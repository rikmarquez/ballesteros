const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Crear empleados de prueba
  const empleados = [
    {
      nombre: "María García",
      telefono: "3001234567",
      puesto: "Cajera Principal",
      puede_operar_caja: true,
      activo: true
    },
    {
      nombre: "Juan Pérez",
      telefono: "3009876543",
      puesto: "Cajero Express",
      puede_operar_caja: true,
      activo: true
    },
    {
      nombre: "Ana López",
      telefono: "3005555555",
      puesto: "Administradora",
      puede_operar_caja: true,
      activo: true
    },
    {
      nombre: "Carlos Ruiz",
      telefono: "3001111111",
      puesto: "Empleado",
      puede_operar_caja: false,
      activo: true
    }
  ]

  // Crear empresas de prueba
  const empresas = [
    { nombre: "Principal", activa: true },
    { nombre: "Express", activa: true },
    { nombre: "Asadero", activa: true }
  ]

  console.log("Creando empresas...")
  for (const empresa of empresas) {
    await prisma.empresa.create({
      data: empresa
    }).catch(() => {
      console.log(`Empresa ${empresa.nombre} ya existe`)
    })
  }

  console.log("Creando empleados...")
  for (const empleado of empleados) {
    await prisma.empleado.create({
      data: empleado
    }).catch(() => {
      console.log(`Empleado ${empleado.nombre} ya existe`)
    })
  }

  console.log("✅ Usuarios de prueba creados exitosamente!")
  console.log("\n📱 Credenciales disponibles:")
  console.log("1. Usuario: 3001234567 | Contraseña: maría garcía")
  console.log("2. Usuario: 3009876543 | Contraseña: juan pérez")
  console.log("3. Usuario: 3005555555 | Contraseña: ana lópez")
  console.log("4. Usuario: 3001111111 | Contraseña: carlos ruiz")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })