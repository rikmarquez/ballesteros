const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedUsuarios() {
  try {
    console.log('🔐 Creando usuarios del sistema...\n')

    // Limpiar usuarios existentes
    await prisma.usuario.deleteMany()
    console.log('🗑️ Usuarios existentes eliminados')

    // Usuarios a crear
    const usuarios = [
      {
        username: 'ricardo',
        password: 'Acceso979971',
        nombre_completo: 'Ricardo Marquez',
        email: 'ricardo@ballesteros.com',
        rol: 'administrador'
      },
      {
        username: 'contadora',
        password: 'Contadora123',
        nombre_completo: 'Ana Rodríguez',
        email: 'contadora@ballesteros.com',
        rol: 'contadora'
      },
      {
        username: 'dueno1',
        password: 'Dueno123',
        nombre_completo: 'Dueño Principal',
        email: 'dueno1@ballesteros.com',
        rol: 'dueno'
      },
      {
        username: 'dueno2',
        password: 'Dueno456',
        nombre_completo: 'Dueño Secundario',
        email: 'dueno2@ballesteros.com',
        rol: 'dueno'
      }
    ]

    console.log('👥 Creando usuarios...')
    for (const userData of usuarios) {
      // Hashear contraseña
      const password_hash = await bcrypt.hash(userData.password, 12)

      const usuario = await prisma.usuario.create({
        data: {
          username: userData.username,
          password_hash,
          nombre_completo: userData.nombre_completo,
          email: userData.email,
          rol: userData.rol,
          activo: true
        }
      })

      console.log(`   ✅ ${usuario.nombre_completo} (${usuario.username}) - Rol: ${usuario.rol}`)
      console.log(`      Contraseña temporal: ${userData.password}`)
    }

    console.log('\n🎉 USUARIOS CREADOS EXITOSAMENTE')
    console.log('\n📋 Credenciales de acceso:')
    console.log('┌─────────────┬─────────────────┬──────────────┬──────────────┐')
    console.log('│ Usuario     │ Nombre          │ Rol          │ Contraseña   │')
    console.log('├─────────────┼─────────────────┼──────────────┼──────────────┤')
    console.log('│ ricardo     │ Ricardo Marquez │ administrador│ Acceso979971 │')
    console.log('│ contadora   │ Ana Rodríguez   │ contadora    │ Contadora123 │')
    console.log('│ dueno1      │ Dueño Principal │ dueno        │ Dueno123     │')
    console.log('│ dueno2      │ Dueño Secundario│ dueno        │ Dueno456     │')
    console.log('└─────────────┴─────────────────┴──────────────┴──────────────┘')

    console.log('\n🔒 Todas las contraseñas están hasheadas en la base de datos')
    console.log('💡 Recuerda cambiar las contraseñas en producción')

  } catch (error) {
    console.error('❌ Error creando usuarios:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

seedUsuarios()