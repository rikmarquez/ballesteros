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

---

## Sesión: 2025-09-21 (Parte 3) - Módulo de Cortes de Caja

### ✅ Módulo Completo de Cortes de Caja Implementado

#### Problema 7: Integración de React Hook Form con shadcn/ui Select
**Contexto:** Los componentes Select de shadcn/ui no se integran directamente con React Hook Form

**Solución aplicada:**
```typescript
// Usar setValue en lugar de register para Select
<Select onValueChange={(value) => setValue('empresa_id', value)}>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona empresa" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Principal</SelectItem>
  </SelectContent>
</Select>

// Validación de errores manual
{errors.empresa_id && (
  <p className="text-sm text-red-600 mt-1">{errors.empresa_id.message}</p>
)}
```

**Aprendizaje:** Los componentes controlados de Radix UI requieren usar setValue() y watch() de React Hook Form en lugar de register().

---

#### Problema 8: Sistema de Notificaciones Toast
**Contexto:** Implementar notificaciones para feedback del usuario

**Error encontrado:**
```
The item at https://ui.shadcn.com/r/styles/new-york-v4/toast.json was not found
```

**Solución aplicada:**
1. Instalar Sonner como alternativa: `npx shadcn@latest add sonner`
2. Integrar Toaster en layout.tsx
3. Usar toast.success() y toast.error() en lugar de objeto toast

**Código relevante:**
```typescript
import { toast } from 'sonner'
import { Toaster } from "@/components/ui/sonner"

// En layout.tsx
<SessionProvider>
  {children}
  <Toaster />
</SessionProvider>

// En componentes
toast.success(`Corte #${corte.id} creado exitosamente`)
toast.error("Error al crear corte")
```

**Aprendizaje:** Sonner es una excelente alternativa a los toast de shadcn/ui con API más simple y mejor UX.

---

### 🎯 Funcionalidades Completadas en Esta Sesión

- [x] ✅ **Estructura completa del módulo de cortes de caja**
  - `/dashboard/cortes` - Página principal con resumen
  - `/dashboard/cortes/nuevo` - Formulario de creación

- [x] ✅ **API endpoints completos**
  - `GET /api/cortes` - Listar con filtros y paginación
  - `POST /api/cortes` - Crear nuevo corte
  - `GET /api/cortes/[id]` - Detalle específico
  - `PUT /api/cortes/[id]` - Actualizar corte
  - `DELETE /api/cortes/[id]` - Soft delete

- [x] ✅ **Interfaz "dos niveles" implementada**
  - Captura manual de VENTA NETA desde POS
  - Cálculo automático de efectivo esperado (85% inicial)
  - Entrada de efectivo real entregado
  - Indicadores visuales de diferencias (sobrante/faltante)

- [x] ✅ **Sistema de validación Zod completo**
  - Esquemas para crear y actualizar cortes
  - Validación de tipos de datos y rangos
  - Transformación automática de strings a números
  - Validación de formularios en tiempo real

- [x] ✅ **React Hook Form integrado**
  - Formulario controlado con validación
  - Watch para recálculos automáticos
  - Manejo de estados de carga y errores
  - Integración con componentes shadcn/ui

- [x] ✅ **Funcionalidades avanzadas**
  - Generación automática de adeudos en `prestamos_empleado`
  - Tolerancia configurable para diferencias ($50)
  - Sistema de tags para búsqueda flexible
  - Validación de cortes únicos por empresa/empleado/fecha/sesión
  - Soft delete para mantener historial

### 🏗️ Arquitectura Técnica Implementada

**Frontend:**
- React Hook Form + Zod para formularios robustos
- shadcn/ui + Sonner para UI consistente
- TypeScript para type safety completo
- Next.js App Router para navegación moderna

**Backend:**
- API Routes con validación de sesión NextAuth
- Prisma para queries type-safe
- Validación Zod en endpoints
- Manejo de errores HTTP apropiado

**Base de Datos:**
- Relaciones Prisma optimizadas
- Constraints únicos para integridad
- Índices implícitos en foreign keys
- Soft delete para auditoría

---

## Sesión: 2025-09-22 - Optimización Interfaz Cortes + Bug Critical venta_credito

### ✅ Optimizaciones de Interfaz Completadas

#### Problema 9: Interfaz de Edición Sobrecargada
**Contexto:** Usuario reportó interfaz con demasiados elementos y campos innecesarios

**Mejoras implementadas:**
1. **Eliminación de campos innecesarios:**
   - Campo "Efectivo Real" removido (calculado automáticamente desde ventas efectivo)
   - Campo "Notas" eliminado (no era necesario)
   - Bloque de información general removido

2. **Layout más compacto:**
   - Campos de movimientos cambiados a single-line layout
   - Títulos redundantes eliminados
   - Spacing mejorado entre tabs y contenido (`pt-10`, `mb-8`)
   - Botón "Agregar" cambiado a color azul para mejor visibilidad

3. **Integración visual:**
   - "Venta Neta" movida a columna derecha de totales
   - Crédito añadido a resumen superior correctamente

**Aprendizaje:** La interfaz debe ser limpia y enfocada. Eliminar campos calculables automáticamente mejora UX significativamente.

---

### 🚨 **BUG CRÍTICO IDENTIFICADO: Ventas a Crédito**

#### Problema 10: venta_credito No Se Guarda (PARCIALMENTE RESUELTO)
**Contexto:** Usuario reportó que movimientos de crédito aparecen en interfaz pero no se persisten

**Análisis realizado:**
✅ **Confirmado:** `venta_credito` SÍ está implementado correctamente en API
✅ **Confirmado:** Frontend muestra cálculos correctamente
✅ **Confirmado:** Endpoint POST y PUT tienen el case `venta_credito`

**3 ERRORES TÉCNICOS BLOQUEANTES identificados:**

1. **Campo `updated_at` inexistente**
   ```
   Unknown argument `updated_at`. Did you mean `created_at`?
   ```
   - **Ubicación**: `src/app/api/cortes/route.ts:614`
   - **Causa**: Prisma schema no incluye campo `updated_at`
   - **Fix**: Remover línea `updated_at: new Date()`

2. **Validación Zod campos nullable**
   ```
   Invalid input: expected number, received null
   ```
   - **Ubicación**: `src/app/api/cortes/route.ts:387`
   - **Campos afectados**: `cliente_id`, `subcategoria_id`, `relacionado_id`
   - **Fix**: Verificar `.nullable().optional()` en esquema

3. **Tipo TypeScript error handler**
   ```
   'error' is of type 'unknown'
   ```
   - **Ubicación**: `src/app/dashboard/cortes/[id]/editar/page.tsx:311`
   - **Fix**: Cambiar `(error)` a `(error: any)`

**Status actual:** ⚠️ venta_credito implementado pero bloqueado por errores de infraestructura

**Tiempo estimado fix:** 15-30 minutos

**Aprendizaje:** Siempre verificar tipos Prisma schema vs código, validaciones Zod, y tipos TypeScript para features nuevas.

---

### 🎯 Funcionalidades Completadas en Esta Sesión

- [x] ✅ **Interfaz optimizada de edición de cortes**
  - Layout compacto single-line
  - Eliminación de campos innecesarios
  - Mejor jerarquía visual y spacing
  - Integración de crédito en resumen

- [x] ✅ **Diagnóstico completo venta_credito**
  - Implementación de API confirmada
  - 3 errores bloqueantes identificados con soluciones específicas
  - Ubicaciones exactas y fixes documentados

### 🔍 Para Próxima Sesión (URGENTE)
- [ ] 🚨 **CRÍTICO**: Arreglar 3 errores bloqueando venta_credito (15-30 min)
- [ ] ✅ Verificar guardado completo de movimientos crédito
- [ ] ✅ Testing completo módulo cortes optimizado