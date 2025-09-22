# Especificaciones Técnicas

## 🗄️ Estructura de Base de Datos

### Conexión Railway PostgreSQL
```env
DATABASE_URL=postgresql://postgres:myZKEVDbnppIZINvbSEyWWlPRsKQgeDH@trolley.proxy.rlwy.net:31671/ballesteros
```

### Entidades Principales

#### Tabla: empresas
```sql
CREATE TABLE empresas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL, -- 'Principal', 'Express', 'Asadero'
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: empleados
```sql
CREATE TABLE empleados (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  puesto VARCHAR(100),
  puede_operar_caja BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: clientes
```sql
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id),
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  saldo_inicial DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: proveedores
```sql
CREATE TABLE proveedores (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id),
  nombre VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: categorias_gasto
```sql
CREATE TABLE categorias_gasto (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(50), -- 'compra', 'servicio', 'mantenimiento', 'personal', 'otros'
  activa BOOLEAN DEFAULT true
);
```

#### Tabla: cortes_caja
```sql
CREATE TABLE cortes_caja (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id),
  empleado_id INTEGER REFERENCES empleados(id),
  fecha DATE NOT NULL,
  sesion INTEGER DEFAULT 1,
  venta_neta DECIMAL(10,2) NOT NULL, -- Captura manual desde POS
  efectivo_esperado DECIMAL(10,2), -- Calculado
  efectivo_real DECIMAL(10,2), -- Entregado por cajera
  diferencia DECIMAL(10,2), -- Calculado
  tags TEXT, -- Etiquetas del corte
  adeudo_generado BOOLEAN DEFAULT false,
  estado VARCHAR(20) DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔌 Endpoints API

### Autenticación (NextAuth.js v5)
- `GET /api/auth/[...nextauth]` - Manejo completo de autenticación
- `GET /api/auth/session` - Obtener sesión actual
- `GET /api/auth/signin` - Página de login
- `POST /api/auth/callback/credentials` - Validación de credenciales
- `GET /api/auth/signout` - Cerrar sesión
- `GET /api/auth/providers` - Proveedores disponibles
- `GET /api/auth/csrf` - Token CSRF

### Cortes de Caja (COMPLETADO)
- `GET /api/cortes` - Listar cortes con filtros y paginación
  - Query params: `empresa_id`, `empleado_id`, `fecha`, `limit`, `offset`
  - Incluye: empresa, empleado, ventas, cortesias, ingresos_turno, egresos_turno
  - Response: `{ cortes, pagination: { total, limit, offset, hasMore } }`
- `POST /api/cortes` - Crear nuevo corte completo con movimientos
  - Validación de corte único por empresa_id + empleado_id + fecha + sesión
  - Cálculo automático de efectivo esperado
  - Generación automática de adeudos en prestamos_empleado
  - Transacción atómica para corte + movimientos
- `GET /api/cortes/[id]` - Detalle de corte con movimientos unificados
  - Convierte movimientos de múltiples tablas a formato unificado para UI
  - Incluye cliente info en ventas/cobranzas
- `PUT /api/cortes` - Actualizar corte existente (query param `id`)
  - Permite actualizar: venta_neta, efectivo_real, tags, movimientos
  - Recálculo automático de diferencias y adeudos
  - Eliminación y recreación de movimientos en transacción

### Movimientos (INTEGRADO EN CORTES)
**Los movimientos ahora se manejan directamente en el módulo de cortes como parte de la creación/edición de cortes. No hay endpoints independientes.**

**Tipos de movimientos soportados:**
- **Ingresos:** `venta_efectivo`, `cobranza`
- **Egresos:** `retiro_parcial`, `venta_tarjeta`, `venta_transferencia`, `gasto`, `compra`, `prestamo`, `cortesia`, `otros_retiros`

**Almacenamiento automático en tablas:**
- `ventas_corte` - Ventas por forma de pago
- `ingresos_turno` - Cobranzas
- `egresos_turno` - Gastos, compras, préstamos, retiros
- `cortesias_corte` - Cortesías
- `prestamos_empleado` - Adeudos automáticos por faltantes

### Catálogos (COMPLETADO)
- `GET /api/empresas` - Listar empresas
  - Query param: `activa` (filter por estado)
  - Response: `{ empresas }`
- `POST /api/empresas` - Crear nueva empresa
  - Validación Zod, verificación de nombre único
- `GET /api/empleados` - Listar empleados con contadores
  - Query params: `activo`, `puede_operar_caja`
  - Include: `_count: { cortes, prestamos }`
- `POST /api/empleados` - Crear nuevo empleado
  - Validación Zod, verificación de nombre único
- `GET /api/clientes` - Listar clientes
  - Query params: `empresa_id`, `search` (nombre/teléfono)
  - Include: empresa info, `_count: { movimientos, ventas_credito, ingresos_turno }`
- `POST /api/clientes` - Crear nuevo cliente
  - Validación empresa activa, nombre único por empresa
- `GET /api/proveedores` - Listar proveedores por empresa
- `POST /api/proveedores` - Crear nuevo proveedor
- `GET /api/categorias` - Listar categorías de gasto activas
- `POST /api/categorias` - Crear nueva categoría
- `GET /api/subcategorias` - Listar subcategorías por categoría
- `POST /api/subcategorias` - Crear nueva subcategoría

**Nota:** Todos los endpoints de catálogos incluyen rutas `[id]` para operaciones individuales (GET, PUT, DELETE)

### Reportes
- `GET /api/reportes/ventas` - Reporte de ventas
- `GET /api/reportes/caja` - Estado de caja
- `GET /api/reportes/consolidado` - Reporte consolidado

## 🏗️ Arquitectura del Proyecto

### Estructura Next.js 14 (App Router)
```
/src
  /app
    /(dashboard)    # Rutas agrupadas del dashboard
      /cortes       # Módulo de cortes de caja (COMPLETADO)
        /page.tsx          # Lista con filtros
        /nuevo/page.tsx    # Creación en 4 pasos
        /[id]/editar/page.tsx # Edición con tabs
      /catalogos    # Gestión de catálogos (PENDIENTE)
      /reportes     # Reportes y consultas (PENDIENTE)
      /cuentas      # Cuentas por cobrar/pagar (PENDIENTE)
    /api            # API Routes
      /auth         # NextAuth.js (COMPLETADO)
        /[...nextauth]/route.ts
      /cortes       # Endpoints de cortes (COMPLETADO)
        /route.ts           # GET, POST, PUT
        /[id]/route.ts      # GET individual
      /empresas     # CRUD empresas (COMPLETADO)
        /route.ts           # GET, POST
        /[id]/route.ts      # GET, PUT, DELETE
      /empleados    # CRUD empleados (COMPLETADO)
      /clientes     # CRUD clientes (COMPLETADO)
      /proveedores  # CRUD proveedores (COMPLETADO)
      /categorias   # CRUD categorías (COMPLETADO)
      /subcategorias # CRUD subcategorías (COMPLETADO)
      /reportes     # Endpoints de reportes (PENDIENTE)
    /login          # Página de autenticación
  /components
    /ui             # shadcn/ui components
    /forms          # Formularios específicos
    /tables         # Tablas de datos
    /dashboard      # Componentes del dashboard
  /lib
    /prisma         # Cliente Prisma y schemas
    /auth           # Configuración NextAuth
    /utils          # Utilidades y helpers
    /validations    # Esquemas Zod
  /types            # Tipos TypeScript
  /hooks            # Custom hooks React
  /store            # Estado global (si aplica)
/prisma
  schema.prisma     # Esquema de base de datos
  /migrations       # Migraciones de DB
```

### Tecnologías Clave
- **Next.js 14**: Framework full-stack con App Router
- **TypeScript**: Type safety en todo el proyecto
- **Prisma**: ORM type-safe para PostgreSQL
- **NextAuth.js v5**: Autenticación y manejo de sesiones (beta) - COMPLETADO
- **Middleware**: Protección automática de rutas - COMPLETADO
- **Tailwind CSS**: Styling utility-first
- **shadcn/ui**: Componentes UI pre-construidos (Button, Card, Input, Select, Tabs, Badge, Separator, Dialog, Sonner)
- **React Hook Form + Zod**: Formularios y validación - COMPLETADO
- **Sonner**: Sistema de notificaciones toast - COMPLETADO
- **bcryptjs**: Hash de contraseñas (desarrollo)

## 🏗️ Detalles de Implementación del Módulo de Cortes

### Características Técnicas Avanzadas

#### 1. Sistema de Movimientos Múltiples
- **Interfaz de edición con tabs:** Ventas, Cobranza, Retiros, Gastos, Cortesías
- **Múltiples movimientos por categoría:** Ej: 5 ventas tarjeta individuales
- **Campos específicos por tipo:**
  - Ventas/Cobranza: selector de cliente
  - Gastos/Compras: selector de categoría y subcategoría
  - Préstamos: selector de empleado
  - Cortesías: campo de beneficiario

#### 2. Cálculos Automáticos
- **Efectivo esperado:** `(Venta Neta + Cobranza) - (Todos los egresos)`
- **Diferencia:** `Efectivo Real - Efectivo Esperado`
- **Totalizadores en tiempo real** para cada categoría
- **Tolerancia configurable:** $50 pesos para generar adeudos

#### 3. Integridad de Datos
- **Constraint único:** `empresa_id + empleado_id + fecha + sesión`
- **Transacciones atómicas:** Corte + movimientos + adeudos
- **Validación Zod** en frontend y backend
- **Soft delete** para mantener historial

#### 4. Generación Automática de Adeudos
- **Adeudo por faltante > $50** → Registro en `prestamos_empleado`
- **Tipo:** `adeudo_faltante`
- **Origen:** `corte_caja`
- **Referencia:** Automática con ID de corte y monto

#### 5. Sistema de Tags
- **Tags flexibles** para búsqueda en movimientos
- **Descripción automática** por tipo de movimiento
- **Búsqueda avanzada** por múltiples campos

## 🚀 Deploy en Railway

### Variables de Entorno
```env
# Base de datos (ya configurada)
DATABASE_URL=postgresql://postgres:myZKEVDbnppIZINvbSEyWWlPRsKQgeDH@trolley.proxy.rlwy.net:31671/ballesteros

# NextAuth.js
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-app.railway.app

# Aplicación
NODE_ENV=production
PORT=3000
```

### Comandos de Build
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && prisma db push && next build",
    "start": "next start",
    "prisma:studio": "prisma studio",
    "prisma:push": "prisma db push",
    "prisma:reset": "prisma db push --force-reset"
  }
}
```

### Configuración Railway
- **Framework:** Next.js
- **Build command:** `npm run build`
- **Start command:** `npm start`
- **Root Directory:** `/`
- **Auto-deploy:** GitHub main branch

### Consideraciones para Railway
- Prisma genera el cliente durante el build
- Las migraciones se aplican automáticamente
- Variables de entorno configuradas en Railway dashboard
- Base de datos PostgreSQL ya configurada en la misma plataforma