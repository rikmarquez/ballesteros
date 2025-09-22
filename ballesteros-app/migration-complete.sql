-- MIGRACIÓN COMPLETA BALLESTEROS
-- Elimina todas las tablas actuales y crea la nueva arquitectura unificada
-- ADVERTENCIA: Este script DESTRUYE todos los datos existentes

-- ======================================
-- 1. ELIMINAR TODAS LAS TABLAS ACTUALES
-- ======================================

-- Eliminar tablas en orden correcto (respetando foreign keys)
DROP TABLE IF EXISTS "prestamos_empleado" CASCADE;
DROP TABLE IF EXISTS "movimientos_cliente" CASCADE;
DROP TABLE IF EXISTS "pagos_proveedor" CASCADE;
DROP TABLE IF EXISTS "cuentas_por_pagar" CASCADE;
DROP TABLE IF EXISTS "egresos_turno" CASCADE;
DROP TABLE IF EXISTS "ingresos_turno" CASCADE;
DROP TABLE IF EXISTS "cortesias_corte" CASCADE;
DROP TABLE IF EXISTS "ventas_corte" CASCADE;
DROP TABLE IF EXISTS "cortes_caja" CASCADE;
DROP TABLE IF EXISTS "caja_contadora" CASCADE;
DROP TABLE IF EXISTS "subcategorias_gasto" CASCADE;
DROP TABLE IF EXISTS "categorias_gasto" CASCADE;
DROP TABLE IF EXISTS "clientes" CASCADE;
DROP TABLE IF EXISTS "proveedores" CASCADE;
DROP TABLE IF EXISTS "empleados" CASCADE;
DROP TABLE IF EXISTS "empresas" CASCADE;

-- ======================================
-- 2. CREAR NUEVA ESTRUCTURA UNIFICADA
-- ======================================

-- Empresas del grupo (Principal, Express, Asadero)
CREATE TABLE "empresas" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(100) NOT NULL,
    "activa" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- Entidades unificadas (clientes, proveedores, empleados)
CREATE TABLE "entidades" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(20),

    -- Flags de tipo (pueden ser múltiples)
    "es_cliente" BOOLEAN DEFAULT false,
    "es_proveedor" BOOLEAN DEFAULT false,
    "es_empleado" BOOLEAN DEFAULT false,

    -- Campos específicos de empleado
    "puesto" VARCHAR(100),
    "puede_operar_caja" BOOLEAN DEFAULT false,

    -- Estado general
    "activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- Tabla pivot: relaciones entidad-empresa
CREATE TABLE "entidades_empresas" (
    "id" SERIAL PRIMARY KEY,
    "entidad_id" INTEGER NOT NULL REFERENCES "entidades"("id"),
    "empresa_id" INTEGER NOT NULL REFERENCES "empresas"("id"),
    "tipo_relacion" VARCHAR(20) NOT NULL, -- 'cliente', 'proveedor'
    "activo" BOOLEAN DEFAULT true,

    UNIQUE("entidad_id", "empresa_id", "tipo_relacion")
);

-- Estados de cuenta por entidad y empresa
CREATE TABLE "saldos" (
    "id" SERIAL PRIMARY KEY,
    "entidad_id" INTEGER NOT NULL REFERENCES "entidades"("id"),
    "empresa_id" INTEGER REFERENCES "empresas"("id"),
    "tipo_saldo" VARCHAR(20) NOT NULL, -- 'cuenta_cobrar', 'cuenta_pagar', 'prestamo'
    "saldo_inicial" DECIMAL(10,2) DEFAULT 0,
    "total_cargos" DECIMAL(10,2) DEFAULT 0,
    "total_abonos" DECIMAL(10,2) DEFAULT 0,
    "saldo_actual" DECIMAL(10,2) DEFAULT 0,
    "fecha_corte" DATE,
    "ultima_actualizacion" TIMESTAMP DEFAULT NOW(),

    UNIQUE("entidad_id", "empresa_id", "tipo_saldo")
);

-- Categorías de gastos (compartidas)
CREATE TABLE "categorias_gasto" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50), -- 'compra', 'servicio', 'mantenimiento', 'personal', 'otros'
    "activa" BOOLEAN DEFAULT true
);

-- Subcategorías de gastos
CREATE TABLE "subcategorias_gasto" (
    "id" SERIAL PRIMARY KEY,
    "categoria_id" INTEGER NOT NULL REFERENCES "categorias_gasto"("id"),
    "nombre" VARCHAR(100) NOT NULL
);

-- Sistema de cuentas (cajeras, efectivo_contadora, fiscal)
CREATE TABLE "cuentas" (
    "id" SERIAL PRIMARY KEY,
    "empresa_id" INTEGER NOT NULL REFERENCES "empresas"("id"),
    "tipo_cuenta" VARCHAR(20) NOT NULL, -- 'cajera', 'efectivo_contadora', 'fiscal'
    "nombre" VARCHAR(100) NOT NULL,
    "saldo_actual" DECIMAL(10,2) DEFAULT 0,
    "activa" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- Cortes de caja con campos específicos por tipo de movimiento
CREATE TABLE "cortes" (
    "id" SERIAL PRIMARY KEY,
    "empresa_id" INTEGER NOT NULL REFERENCES "empresas"("id"),
    "entidad_id" INTEGER NOT NULL REFERENCES "entidades"("id"), -- empleado que hizo el corte
    "fecha" DATE NOT NULL,
    "sesion" INTEGER DEFAULT 1,

    -- CAPTURA MANUAL
    "venta_neta" DECIMAL(10,2) NOT NULL, -- Desde POS

    -- INGRESOS (actualizados automáticamente)
    "venta_efectivo" DECIMAL(10,2) DEFAULT 0,
    "venta_credito" DECIMAL(10,2) DEFAULT 0,
    "venta_plataforma" DECIMAL(10,2) DEFAULT 0,
    "cobranza" DECIMAL(10,2) DEFAULT 0,

    -- EGRESOS (actualizados automáticamente)
    "venta_tarjeta" DECIMAL(10,2) DEFAULT 0,
    "venta_transferencia" DECIMAL(10,2) DEFAULT 0,
    "retiro_parcial" DECIMAL(10,2) DEFAULT 0,
    "gasto" DECIMAL(10,2) DEFAULT 0,
    "compra" DECIMAL(10,2) DEFAULT 0,
    "prestamo" DECIMAL(10,2) DEFAULT 0,
    "cortesia" DECIMAL(10,2) DEFAULT 0,
    "otros_retiros" DECIMAL(10,2) DEFAULT 0,

    -- CÁLCULOS AUTOMÁTICOS
    "total_ingresos" DECIMAL(10,2) DEFAULT 0,
    "total_egresos" DECIMAL(10,2) DEFAULT 0,
    "efectivo_esperado" DECIMAL(10,2) DEFAULT 0,
    "diferencia" DECIMAL(10,2) DEFAULT 0,

    -- METADATOS
    "adeudo_generado" BOOLEAN DEFAULT false,
    "estado" VARCHAR(20) DEFAULT 'activo',
    "created_at" TIMESTAMP DEFAULT NOW(),

    UNIQUE("empresa_id", "entidad_id", "fecha", "sesion")
);

-- Tabla unificada de movimientos
CREATE TABLE "movimientos" (
    "id" SERIAL PRIMARY KEY,
    "tipo_movimiento" VARCHAR(50) NOT NULL,
    "es_ingreso" BOOLEAN NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP DEFAULT NOW(),

    -- Cuentas afectadas
    "cuenta_origen_id" INTEGER REFERENCES "cuentas"("id"),
    "cuenta_destino_id" INTEGER REFERENCES "cuentas"("id"),
    "fecha_aplicacion" DATE, -- Para movimientos diferidos

    -- Relaciones principales
    "empresa_id" INTEGER REFERENCES "empresas"("id"),
    "corte_id" INTEGER REFERENCES "cortes"("id"),

    -- Entidades relacionadas
    "entidad_relacionada_id" INTEGER REFERENCES "entidades"("id"), -- Cliente/proveedor involucrado
    "empleado_responsable_id" INTEGER REFERENCES "entidades"("id"), -- Quién hizo la transacción

    -- Categorización
    "categoria_id" INTEGER REFERENCES "categorias_gasto"("id"),
    "subcategoria_id" INTEGER REFERENCES "subcategorias_gasto"("id"),

    -- Metadatos
    "forma_pago" VARCHAR(20), -- 'efectivo', 'tarjeta', 'transferencia'
    "plataforma" VARCHAR(50), -- 'uber_eats', 'rappi', 'didi_food'
    "referencia" TEXT, -- Folios, tickets, descripciones
    "beneficiario" VARCHAR(255), -- Para cortesías
    "comision" DECIMAL(10,2) DEFAULT 0, -- Para tarjetas/plataformas

    "created_at" TIMESTAMP DEFAULT NOW()
);

-- ======================================
-- 3. CREAR ÍNDICES PARA PERFORMANCE
-- ======================================

-- Índices en movimientos (tabla más consultada)
CREATE INDEX "idx_movimientos_fecha" ON "movimientos"("fecha");
CREATE INDEX "idx_movimientos_corte" ON "movimientos"("corte_id");
CREATE INDEX "idx_movimientos_empresa_fecha" ON "movimientos"("empresa_id", "fecha");
CREATE INDEX "idx_movimientos_tipo" ON "movimientos"("tipo_movimiento");
CREATE INDEX "idx_movimientos_entidad" ON "movimientos"("entidad_relacionada_id");

-- Índices en entidades
CREATE INDEX "idx_entidades_nombre" ON "entidades"("nombre");
CREATE INDEX "idx_entidades_tipo" ON "entidades"("es_cliente", "es_proveedor", "es_empleado");

-- Índices en cortes
CREATE INDEX "idx_cortes_fecha" ON "cortes"("fecha");
CREATE INDEX "idx_cortes_empresa_fecha" ON "cortes"("empresa_id", "fecha");

-- ======================================
-- 4. DATOS INICIALES BÁSICOS
-- ======================================

-- Empresas base
INSERT INTO "empresas" ("nombre", "activa") VALUES
('Principal', true),
('Express', true),
('Asadero', true);

-- Categorías de gasto básicas
INSERT INTO "categorias_gasto" ("nombre", "tipo", "activa") VALUES
('Compras', 'compra', true),
('Servicios', 'servicio', true),
('Mantenimiento', 'mantenimiento', true),
('Personal', 'personal', true),
('Otros', 'otros', true);

-- Subcategorías básicas
INSERT INTO "subcategorias_gasto" ("categoria_id", "nombre") VALUES
(1, 'Carne'),
(1, 'Abarrotes'),
(2, 'Luz'),
(2, 'Agua'),
(2, 'Internet'),
(3, 'Refrigeración'),
(3, 'Equipos'),
(4, 'Sueldos'),
(4, 'Préstamos'),
(5, 'Varios');

-- Cuentas básicas por empresa
INSERT INTO "cuentas" ("empresa_id", "tipo_cuenta", "nombre", "activa") VALUES
-- Principal
(1, 'cajera', 'Caja Cajeras Principal', true),
(1, 'efectivo_contadora', 'Caja Efectivo Contadora Principal', true),
(1, 'fiscal', 'Cuenta Fiscal BBVA Principal', true),
-- Express
(2, 'cajera', 'Caja Cajeras Express', true),
(2, 'efectivo_contadora', 'Caja Efectivo Contadora Express', true),
(2, 'fiscal', 'Cuenta Fiscal BBVA Express', true),
-- Asadero
(3, 'cajera', 'Caja Cajeras Asadero', true),
(3, 'efectivo_contadora', 'Caja Efectivo Contadora Asadero', true),
(3, 'fiscal', 'Cuenta Fiscal BBVA Asadero', true);

-- ======================================
-- MIGRACIÓN COMPLETADA
-- ======================================

-- Verificación final
SELECT 'Migración completada exitosamente' as resultado;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;