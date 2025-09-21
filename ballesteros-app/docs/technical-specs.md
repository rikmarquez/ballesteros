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

### Autenticación (NextAuth.js)
- `GET /api/auth/signin` - Página de login
- `POST /api/auth/signin` - Proceso de login
- `GET /api/auth/signout` - Cerrar sesión
- `GET /api/auth/session` - Obtener sesión actual

### Cortes de Caja
- `GET /api/cortes` - Listar cortes
  - Query: `?empresa_id=1&empleado_id=2&fecha=2025-09-21`
- `POST /api/cortes` - Crear nuevo corte
- `GET /api/cortes/[id]` - Detalle de corte
- `PUT /api/cortes/[id]` - Actualizar corte

### Movimientos
- `POST /api/movimientos/ingreso` - Registrar ingreso
- `POST /api/movimientos/egreso` - Registrar egreso
- `GET /api/movimientos/buscar` - Buscar por tags

### Catálogos
- `GET /api/empresas` - Listar empresas
- `GET /api/empleados` - Listar empleados
- `GET /api/clientes` - Listar clientes
- `GET /api/proveedores` - Listar proveedores
- `GET /api/categorias` - Listar categorías

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
      /cortes       # Módulo de cortes de caja
      /movimientos  # Ingresos y egresos
      /reportes     # Reportes y consultas
      /catalogos    # Empleados, clientes, etc.
    /api            # API Routes
      /auth         # NextAuth.js
      /cortes       # Endpoints de cortes
      /movimientos  # Endpoints de movimientos
      /reportes     # Endpoints de reportes
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
/prisma
  schema.prisma     # Esquema de base de datos
  /migrations       # Migraciones de DB
```

### Tecnologías Clave
- **Next.js 14**: Framework full-stack con App Router
- **TypeScript**: Type safety en todo el proyecto
- **Prisma**: ORM type-safe para PostgreSQL
- **NextAuth.js**: Autenticación y manejo de sesiones
- **Tailwind CSS**: Styling utility-first
- **shadcn/ui**: Componentes UI pre-construidos
- **React Hook Form + Zod**: Formularios y validación
- **Zustand**: State management ligero

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