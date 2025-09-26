-- Migración: Actualizar a sistema de 6 cuentas con traspasos
-- Fecha: 2025-09-25

BEGIN;

-- 1. Agregar campo es_traspaso a movimientos existentes
ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS es_traspaso BOOLEAN DEFAULT false;

-- 2. Agregar campos nuevos a cuentas
ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS descripcion VARCHAR(255);
ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS empresa_asociada VARCHAR(50);

-- 3. Limpiar cuentas existentes (empezar desde cero)
DELETE FROM cuentas;

-- 4. Crear las 6 cuentas específicas
INSERT INTO cuentas (tipo_cuenta, nombre, descripcion, empresa_asociada, saldo_actual) VALUES
-- Cuentas Centralizadas
('contadora', 'Efectivo Contadora', 'Efectivo consolidado de todas las sucursales', NULL, 0),
('fiscal', 'Cuenta Fiscal', 'Tarjetas, transferencias y pagos bancarios', NULL, 0),

-- Cuentas Específicas por Cajera/Sucursal
('cajera', 'Caja Carlos', 'Caja personal del dueño', NULL, 0),
('cajera', 'Cajera Carnicería', 'Operaciones diarias Principal', 'Principal', 0),
('cajera', 'Cajera Express', 'Operaciones diarias Express', 'Express', 0),
('cajera', 'Cajera Asadero', 'Operaciones diarias Asadero', 'Asadero', 0);

-- 5. Agregar validaciones para traspasos
ALTER TABLE movimientos ADD CONSTRAINT check_traspaso_cuentas
    CHECK (es_traspaso = false OR (cuenta_origen_id IS NOT NULL AND cuenta_destino_id IS NOT NULL));

-- 6. Actualizar índices para el nuevo campo
CREATE INDEX IF NOT EXISTS idx_movimientos_traspaso ON movimientos(es_traspaso);
CREATE INDEX IF NOT EXISTS idx_cuentas_empresa ON cuentas(empresa_asociada);

COMMIT;

-- Verificar resultado
SELECT
    id,
    tipo_cuenta,
    nombre,
    empresa_asociada,
    saldo_actual
FROM cuentas
ORDER BY
    CASE tipo_cuenta
        WHEN 'contadora' THEN 1
        WHEN 'fiscal' THEN 2
        WHEN 'cajera' THEN 3
    END,
    empresa_asociada NULLS FIRST,
    nombre;