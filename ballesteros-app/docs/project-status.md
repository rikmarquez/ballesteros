# Estado del Proyecto

**Última actualización:** 2025-09-22
**Versión:** 0.2.1
**Ambiente de despliegue:** Railway

## 🎯 Objetivo del Proyecto
Sistema web de control financiero para un grupo de 3 carnicerías relacionadas (Principal, Express, Asadero). Reemplazar múltiples hojas de Excel con sistema unificado para control de cortes de caja, cuentas por cobrar/pagar, proveedores, empleados y reportes consolidados.

## ✅ Funcionalidades Completadas

### 🔐 Sistema Base
- [x] Estructura de documentación del proyecto
- [x] Base de datos PostgreSQL configurada en Railway
- [x] Proyecto Next.js 14 con TypeScript inicializado
- [x] Esquema Prisma completo desplegado (13 tablas)
- [x] shadcn/ui componentes configurados
- [x] Sistema de autenticación NextAuth.js completado
- [x] Middleware de protección de rutas implementado
- [x] Página de login con validación de credenciales
- [x] Dashboard mejorado con layout centrado y UI optimizada

### 💰 Módulo de Cortes de Caja - COMPLETADO
- [x] **Página de listado con filtros avanzados** (empresa, empleado, fecha)
- [x] **Formulario de creación con 4 pasos progresivos**
- [x] **Interfaz de edición con tabs detallados por categorías**
- [x] **Múltiples movimientos individuales por categoría** (ej: 5 ventas tarjeta individuales)
- [x] **Totalizadores automáticos en tiempo real**
- [x] **Campos específicos por tipo de movimiento:**
  - Ventas/Cobranza: selector de cliente
  - Gastos/Compras: selector de categoría
  - Préstamos: selector de empleado
  - Cortesías: campo de beneficiario
- [x] **Cálculo automático del efectivo esperado:** (Venta Neta + Cobranza) - (Todos los egresos)
- [x] **APIs completas para CRUD de cortes**
- [x] **Validación con Zod y React Hook Form**
- [x] **Sistema de notificaciones Sonner**

### 📊 Catálogos de Soporte - COMPLETADOS
- [x] **APIs completas para todos los catálogos:**
  - Empresas (CRUD completo)
  - Empleados (CRUD completo + filtro por puede_operar_caja)
  - Clientes (CRUD completo)
  - Proveedores (CRUD completo)
  - Categorías y Subcategorías (CRUD completo)
- [x] **Scripts de seeding para datos de prueba**
- [x] **Componentes UI adicionales:** tabs, separator, badge

## 🚧 En Progreso
### ⚠️ CRÍTICO: Ventas a Crédito - Casi Completado
- [x] **Implementación de venta_credito en API**: Agregado en endpoints POST y PUT
- [x] **Interfaz de usuario**: Mostrado correctamente en cálculos y tabs
- [ ] **BLOQUEADO POR 3 ERRORES**: Guardado falla por problemas de infraestructura (ver sección Bugs Conocidos)

## 📝 Próximos Pasos (PRIORIDAD INMEDIATA)

### 🚨 **URGENTE - Completar Ventas a Crédito (15-30 min)**
1. **Arreglar 3 errores técnicos bloqueantes:**
   - Remover campo `updated_at` inexistente del API (línea ~614 en route.ts)
   - Corregir tipo TypeScript en error handler frontend (línea 311)
   - Verificar validación Zod para campos nullable
2. **Probar guardado de venta_credito** completo
3. **Verificar cálculos** en resumen superior

### 📋 **Siguientes Tareas**
4. **TESTING COMPLETO** del módulo de cortes de caja
5. Crear interfaces de gestión para catálogos (páginas CRUD)
6. Implementar módulo de reportes básicos
7. Desarrollar módulo de cuentas por cobrar/pagar
8. Implementar dashboard con métricas consolidadas

## 🐛 Bugs Conocidos

### ✅ Resueltos
- ✅ Error de hidratación resuelto con suppressHydrationWarning
- ✅ Event handlers en Server Components solucionado con 'use client'

### 🚨 **CRÍTICOS - Bloqueando Ventas a Crédito**
1. **Campo inexistente `updated_at`** (API route.ts ~línea 614)
   - **Error**: `Unknown argument 'updated_at'. Did you mean 'created_at'?`
   - **Solución**: Remover línea `updated_at: new Date()` del Prisma update
   - **Ubicación**: `src/app/api/cortes/route.ts`

2. **Validación Zod campos nullable** (API route.ts ~línea 387)
   - **Error**: `Invalid input: expected number, received null` en cliente_id, subcategoria_id, etc.
   - **Solución**: Verificar schema Zod para `.nullable().optional()`
   - **Status**: Parcialmente arreglado, revisar casos restantes

3. **Tipo TypeScript error handler** (Frontend página 311)
   - **Error**: `'error' is of type 'unknown'`
   - **Solución**: Añadir tipo correcto: `(error: any)` o casting
   - **Ubicación**: `src/app/dashboard/cortes/[id]/editar/page.tsx:311`

## 🔧 Configuración Actual
- **Framework:** Next.js 14 + TypeScript
- **Base de datos:** PostgreSQL en Railway
- **ORM:** Prisma
- **Styling:** Tailwind CSS + shadcn/ui
- **Deploy:** Railway
- **Variables de entorno necesarias:**
  - `DATABASE_URL=postgresql://postgres:myZKEVDbnppIZINvbSEyWWlPRsKQgeDH@trolley.proxy.rlwy.net:31671/ballesteros`
  - `NEXTAUTH_SECRET` (para autenticación)
  - `NEXTAUTH_URL` (para Railway deploy)

## 📌 Notas Importantes
- La base de datos PostgreSQL ya está configurada en Railway
- Sistema multi-empresa (3 carnicerías) con roles diferenciados
- Interfaz responsiva: laptop para contadora, móvil/tablet para dueños
- Sistema de tags para búsquedas flexibles en todos los movimientos
- Cálculo automático de efectivo esperado basado en VENTA NETA del POS