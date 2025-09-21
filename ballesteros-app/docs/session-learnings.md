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

### 🔍 Para Investigar
- [ ] Implementación de NextAuth.js para autenticación
- [ ] Optimización de queries Prisma para el sistema de tags
- [ ] Estrategias de validación con Zod para formularios complejos
- [ ] Implementación de middleware para protección de rutas