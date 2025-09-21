# Aprendizajes y Soluciones

## Sesión: 2025-09-21

### ✅ Problemas Resueltos

#### Problema 1: Error de Event Handlers en Server Components
**Contexto:** Al implementar la página principal con botones interactivos

**Error encontrado:**
```
Event handlers cannot be passed to Client Component props.
<button onClick={function onClick} children=...>
If you need interactivity, consider converting part of this to a Client Component.
```

**Solución aplicada:**
Agregar `'use client'` al inicio del archivo page.tsx para convertirlo en Client Component

**Código relevante:**
```typescript
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
// ... resto del componente
```

**Aprendizaje:** En Next.js 14 con App Router, los componentes son Server Components por defecto. Para usar event handlers como onClick, necesitamos convertirlos en Client Components con la directiva 'use client'.

---

#### Problema 2: Error de Hidratación de React
**Contexto:** Warning de hidratación debido a diferencias entre server y client rendering

**Error encontrado:**
```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

**Solución aplicada:**
Agregar `suppressHydrationWarning={true}` al elemento body en layout.tsx

**Código relevante:**
```typescript
<body
  className={`${geistSans.variable} ${geistMono.variable} antialiased`}
  suppressHydrationWarning={true}
>
```

**Aprendizaje:** Las extensiones del navegador pueden añadir atributos al DOM después del renderizado del servidor, causando diferencias de hidratación. suppressHydrationWarning soluciona warnings causados por estos cambios externos.

---

#### Problema 3: Relaciones Prisma Bidireccionales Faltantes
**Contexto:** Error al hacer push del schema Prisma a la base de datos

**Error encontrado:**
```
Error validating field `cliente` in model `IngresoTurno`: The relation field `cliente` on model `IngresoTurno` is missing an opposite relation field on the model `Cliente`.
```

**Solución aplicada:**
Añadir la relación inversa en el modelo Cliente

**Código relevante:**
```prisma
model Cliente {
  // ... otros campos
  ingresos_turno   IngresoTurno[]
}
```

**Aprendizaje:** En Prisma, todas las relaciones deben ser bidireccionales. Si un modelo referencia a otro, el modelo referenciado debe incluir la relación inversa.

### 💡 Mejores Prácticas Descubiertas
- **Client vs Server Components:** Usar 'use client' solo cuando necesites interactividad
- **Prisma Schema:** Siempre definir relaciones bidireccionales para evitar errores
- **Environment Variables:** Configurar .env desde el inicio para evitar problemas de conexión
- **shadcn/ui:** Instalar componentes base (button, card, input, etc.) al inicio del proyecto

---

## Sesión: 2025-09-21 (Parte 2)

### ✅ Sistema de Autenticación Implementado

#### Problema 4: Errores de Compilación Impidiendo Middleware
**Contexto:** El middleware no se ejecutaba debido a errores de TypeScript/webpack previos

**Error encontrado:**
```
Module parse failed: Identifier 'router' has already been declared (31:10)
TypeError: __webpack_modules__[moduleId] is not a function
```

**Solución aplicada:**
1. Limpiar cache de Next.js con `rm -rf .next`
2. Reiniciar servidor de desarrollo
3. Reorganizar configuración de NextAuth moviendo PrismaAdapter al final

**Aprendizaje:** Los errores de compilación previos pueden impedir que el middleware se ejecute. Siempre resolver errores de build antes de diagnosticar problemas de middleware.

---

#### Problema 5: NextAuth v5 Beta Configuración con Next.js 15
**Contexto:** Implementando NextAuth.js v5 beta con Next.js 15 y Prisma

**Configuración exitosa:**
```typescript
// src/lib/auth.ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      // ... configuración
    })
  ],
  callbacks: {
    async jwt({ token, user }) { /* ... */ },
    async session({ session, token }) { /* ... */ }
  },
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  adapter: PrismaAdapter(prisma) // Al final para evitar conflictos webpack
})
```

**Middleware funcional:**
```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const session = await auth()

  // Lógica de redirección basada en sesión
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (pathname === '/' && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}
```

**Aprendizaje:** NextAuth v5 requiere configuración específica del adaptador y manejo cuidadoso del orden de configuración para evitar errores de webpack.

---

#### Problema 6: UI/UX del Dashboard
**Contexto:** Layout inicial con elementos desalineados y mal espaciados

**Solución aplicada:**
```typescript
// Header centrado
<div className="text-center mb-8">
  <h1 className="text-4xl font-bold text-gray-900 mb-2">
    Sistema Financiero Ballesteros
  </h1>
  <p className="text-lg text-gray-600 mb-2">
    Control financiero para Carnicería Principal, Express y Asadero
  </p>
  {session && (
    <p className="text-sm text-green-600">
      Bienvenido: {session.user.name} ({session.user.puesto})
    </p>
  )}
</div>

// Botón alineado con módulos
<div className="max-w-4xl mx-auto mb-6 flex justify-end">
  <Button variant="outline" onClick={() => signOut()}>
    Cerrar Sesión
  </Button>
</div>
```

**Aprendizaje:** Usar `max-w-4xl mx-auto` para alinear elementos con el grid de módulos y `text-center` para headers mejora significativamente la apariencia visual.

### 🎯 Funcionalidades Completadas en Esta Sesión
- [x] ✅ Sistema completo de autenticación NextAuth.js v5
- [x] ✅ Middleware para protección automática de rutas
- [x] ✅ Página de login con validación contra base de datos
- [x] ✅ Dashboard con layout mejorado y centrado
- [x] ✅ Redirecciones automáticas login ↔ dashboard
- [x] ✅ SessionProvider configurado en layout
- [x] ✅ Tipos TypeScript extendidos para NextAuth
- [x] ✅ Script de datos de prueba para empleados

### 🔍 Para Investigar
- [ ] Optimización de queries Prisma para el sistema de tags
- [ ] Estrategias de validación con Zod para formularios complejos
- [ ] Implementación de roles y permisos granulares
- [ ] Optimización de middleware para mejor performance