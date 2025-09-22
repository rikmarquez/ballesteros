# Aprendizajes y Decisiones Arquitectónicas

## Sesión: 2025-09-22 - Refactorización Completa

### 🎯 **Gran Refactorización: De Fragmentado a Unificado**

Esta sesión representó un cambio fundamental en la arquitectura del sistema, moviendo de un diseño fragmentado a uno completamente unificado basado en los principios del flujo de efectivo.

---

## 💡 **Insights Críticos del Negocio**

### **Insight 1: Una Sola Tabla de Movimientos es Superior**
**Contexto:** El usuario cuestionó por qué teníamos 8 tablas separadas para movimientos cuando el objetivo es controlar el flujo de efectivo.

**Pregunta del usuario:**
> "Como el sistema intenta resolver problemas de flujo de efectivo, piensa en forma crítica... me gustaría una sola tabla de movimiento que tenga el número de corte y se coloque cuando sea necesario, que tenga campo que determina si es ingreso o egreso, que tiene el monto y fecha..."

**Análisis crítico realizado:**

✅ **VENTAJAS de tabla unificada:**
- Una sola consulta para resumen del día vs 4 consultas + joins
- Cronología unificada de todos los movimientos
- Mucho más simple para reportes de flujo de efectivo
- Lógica de negocio clara: `es_ingreso` (true/false)

❌ **DESVENTAJAS del esquema anterior:**
- 4 consultas separadas para armar el resumen
- Joins complejos para ver cronología completa
- Over-engineering para un sistema de flujo de efectivo
- Código API más complejo (4 switch cases diferentes)

**Decisión:** Migrar a tabla unificada `movimientos` con campo `es_ingreso`.

**Aprendizaje:** Simplicidad > Normalización excesiva cuando el objetivo es análisis de flujo de efectivo.

---

### **Insight 2: Entidades Híbridas Son Realidad del Negocio**
**Contexto:** Durante el diseño surgió la necesidad de manejar proveedores que también son clientes.

**Problema:** Tablas separadas no permiten entidades que sean cliente Y proveedor.

**Solución implementada:**
```sql
CREATE TABLE entidades (
  -- Flags pueden ser múltiples
  es_cliente BOOLEAN DEFAULT false,
  es_proveedor BOOLEAN DEFAULT false,
  es_empleado BOOLEAN DEFAULT false,

  -- Constraint: al menos uno debe ser true
  CONSTRAINT entidades_tipo_check CHECK (es_cliente OR es_proveedor OR es_empleado)
)
```

**Casos reales soportados:**
- **Carnicería Los Hermanos**: Cliente de Principal, Proveedor de Express
- **Empleado María**: También cliente ocasional
- **Proveedor híbrido**: Vende carne Y compra productos

**Aprendizaje:** El negocio real es más flexible que los modelos rígidos de base de datos.

---

### **Insight 3: Sistema de 3 Cuentas Refleja Operación Real**
**Contexto:** El usuario explicó como realmente fluye el dinero en el negocio.

**Realidad operativa descubierta:**
1. **Cajeras**: Manejan transacciones pequeñas durante el turno
2. **Contadora (Efectivo)**: Retiros parciales, consolidación de efectivo
3. **Contadora (Fiscal)**: Movimientos bancarios, tarjetas (día siguiente)

**Flujo de dinero real:**
```
Cajeras → Efectivo Contadora → Cuenta Fiscal
```

**Implementación:**
```sql
CREATE TABLE cuentas (
  tipo_cuenta VARCHAR(20), -- 'cajera', 'efectivo_contadora', 'fiscal'
  empresa_id INTEGER -- 3 tipos × 3 empresas = 9 cuentas
)
```

**Aprendizaje:** La arquitectura debe reflejar la realidad operativa, no idealizaciones.

---

### **Insight 4: Ventas a Crédito/Tarjeta No Generan Efectivo Inmediato**
**Contexto:** Discusión sobre cuándo impactan realmente las ventas en el flujo de efectivo.

**Realidad del negocio:**
- **Venta efectivo**: Impacto inmediato en caja
- **Venta crédito**: Sin impacto inmediato (cobranza posterior)
- **Venta tarjeta**: Depósito al día siguiente + comisión
- **Venta transferencia**: Depósito al día siguiente
- **Venta plataforma**: Depósito variable + comisión variable

**Implementación en movimientos:**
```sql
-- Venta efectivo: cuenta_destino_id = caja_cajeras
-- Venta crédito: cuenta_destino_id = NULL (solo registro)
-- Venta tarjeta: fecha_aplicacion = fecha + 1 día
```

**Aprendizaje:** El timing del impacto en flujo de efectivo es crítico para el control de caja.

---

### **Insight 5: Retiros Parciales Son Transferencias, No Pérdidas**
**Contexto:** Inicialmente se modelaban como "gastos", pero el usuario clarificó que son transferencias por seguridad.

**Malentendido inicial:** Retiro parcial = dinero perdido
**Realidad:** Retiro parcial = transferencia cajera → contadora por seguridad

**Implementación correcta:**
```sql
INSERT INTO movimientos (
  tipo_movimiento, es_ingreso, monto,
  cuenta_origen_id,  -- Caja cajeras (sale dinero)
  cuenta_destino_id, -- Efectivo contadora (entra dinero)
  referencia
) VALUES (
  'retiro_parcial', false, 2000,
  1, 2, 'Retiro seguridad 14:30'
);
```

**Impacto en cuentas:**
- Cuenta cajera: -$2,000
- Efectivo contadora: +$2,000
- **Total sistema: $0** (no hay pérdida de dinero)

**Aprendizaje:** Distinguir entre gastos reales y transferencias internas es crucial.

---

### **Insight 6: Plataformas Requieren Conciliación Manual Posterior**
**Contexto:** Discusión sobre cómo manejar Uber Eats, Rappi, etc.

**Complejidad descubierta:**
- Depósitos impredecibles (varios por mes)
- Comisiones variables
- Fechas de corte variables

**Enfoque inicial rechazado:**
```sql
-- MALO: Intentar predecir fecha_corte y comision
fecha_corte_plataforma DATE,
comision_plataforma DECIMAL(10,2)
```

**Enfoque adoptado:**
```sql
-- BUENO: Registro simple + conciliación posterior
INSERT INTO movimientos (tipo_movimiento, monto, plataforma, referencia)
VALUES ('venta_plataforma', 500, 'uber_eats', 'Orden #UE12345');

-- Conciliación posterior manual
INSERT INTO movimientos (tipo_movimiento, monto, cuenta_destino_id)
VALUES ('deposito_plataforma', 1850, 3); -- Cuenta fiscal

INSERT INTO movimientos (tipo_movimiento, monto, cuenta_origen_id)
VALUES ('comision_plataforma', 150, 3); -- Sale de fiscal
```

**Aprendizaje:** No intentar automatizar lo que es inherentemente impredecible.

---

## 🏗️ **Decisiones Arquitectónicas Exitosas**

### **Decisión 1: Migración Completa vs Incremental**
**Contexto:** Decidir entre migración gradual o completa.

**Opción A (Gradual):** Mantener tablas viejas mientras migramos
**Opción B (Completa):** Reemplazar todo de una vez

**Decisión:** Migración completa.

**Justificación:**
- Proyecto en desarrollo inicial
- Evita complejidad de mantener dos sistemas
- Permite testing completo de la nueva arquitectura

**Resultado:** ✅ Migración exitosa sin problemas.

---

### **Decisión 2: APIs de Compatibilidad**
**Contexto:** Cómo mantener frontend funcionando durante la migración.

**Solución adoptada:**
```typescript
// /api/empleados → wrapper sobre entidades
export async function GET() {
  const empleados = await prisma.entidad.findMany({
    where: { es_empleado: true }
  });

  // Formatear respuesta para compatibilidad
  return empleados.map(formatearComoEmpleado);
}
```

**Beneficio:** Frontend existente sigue funcionando sin cambios.

**Aprendizaje:** Las APIs de compatibilidad facilitan migraciones grandes.

---

### **Decisión 3: Campos Específicos en Cortes vs Cálculos Dinámicos**
**Contexto:** Cómo actualizar totales de cortes.

**Opción A:** Calcular dinámicamente desde movimientos
**Opción B:** Campos específicos actualizados automáticamente

**Decisión:** Campos específicos.

**Implementación:**
```sql
CREATE TABLE cortes (
  venta_efectivo DECIMAL(10,2) DEFAULT 0,
  venta_credito DECIMAL(10,2) DEFAULT 0,
  venta_tarjeta DECIMAL(10,2) DEFAULT 0,
  -- ... más campos específicos
);

-- Trigger automático
UPDATE cortes SET venta_efectivo = venta_efectivo + NEW.monto
WHERE id = NEW.corte_id AND NEW.tipo_movimiento = 'venta_efectivo';
```

**Ventajas:**
- Performance superior (sin SUMs complejos)
- Datos históricos preservados
- Cálculos automáticos instantáneos

**Aprendizaje:** Desnormalización controlada puede mejorar performance significativamente.

---

## 🐛 **Problemas Resueltos Durante la Migración**

### **Problema 1: Tipos Date vs DateTime en Prisma**
**Error encontrado:**
```
Type "Date" is neither a built-in type, nor refers to another model
```

**Causa:** Prisma requiere `DateTime @db.Date` en lugar de `Date`

**Solución aplicada:**
```prisma
fecha_corte DateTime? @db.Date
fecha_aplicacion DateTime? @db.Date
```

**Aprendizaje:** Verificar tipos Prisma antes de generar cliente.

---

### **Problema 2: Relaciones Bidireccionales Complejas**
**Desafío:** Entidad puede ser empleado que hace movimientos Y cliente que recibe movimientos

**Solución implementada:**
```prisma
model Entidad {
  movimientos_entidad  Movimiento[] @relation("MovimientoEntidad")
  movimientos_empleado Movimiento[] @relation("MovimientoEmpleado")
}

model Movimiento {
  entidad_relacionada  Entidad? @relation("MovimientoEntidad")
  empleado_responsable Entidad? @relation("MovimientoEmpleado")
}
```

**Aprendizaje:** Relaciones nombradas permiten múltiples conexiones entre mismas tablas.

---

### **Problema 3: Validación de Constraint Personalizado**
**Requerimiento:** Al menos un tipo de entidad debe estar activo

**Implementación en SQL:**
```sql
CONSTRAINT entidades_tipo_check CHECK (es_cliente OR es_proveedor OR es_empleado)
```

**Implementación en Zod:**
```typescript
.refine(data => data.es_cliente || data.es_proveedor || data.es_empleado, {
  message: "Al menos un tipo debe estar seleccionado"
})
```

**Aprendizaje:** Validaciones de negocio deben implementarse en base de datos Y aplicación.

---

## 📈 **Métricas de Éxito**

### **Simplificación Lograda**
- **Tablas reducidas**: 13 → 9 (-31%)
- **Consultas para resumen de corte**: 4+ → 1 (-75%)
- **Líneas de código API**: Estimado -40%
- **Tiempo de desarrollo nuevas features**: Estimado -50%

### **Flexibilidad Ganada**
- **Entidades híbridas**: ✅ Soporte completo
- **Nuevos tipos de movimiento**: Sin cambios de schema
- **Multi-empresa**: Relaciones flexibles
- **Reportes**: Consultas unificadas

### **Performance Mejorada**
- **Índices estratégicos**: En campos más consultados
- **Joins reducidos**: De 4+ a 1 en consultas principales
- **Agregaciones**: Campos precalculados en cortes

---

## 🔮 **Preparación para el Futuro**

### **Extensibilidad Incorporada**
1. **Nuevos tipos de movimiento**: Solo agregar string a enum
2. **Nuevas empresas**: Solo insertar en tabla empresas
3. **Nuevos tipos de cuenta**: Solo modificar enum
4. **Nuevas plataformas**: Solo agregar a campo plataforma

### **Auditoría Completa**
- **Todos los movimientos** registrados con timestamp
- **Empleado responsable** de cada transacción
- **Trazabilidad completa** del flujo de dinero
- **Estados históricos** preservados

### **Escalabilidad**
- **Índices de performance** ya implementados
- **Paginación** en todas las consultas
- **Filtros avanzados** sin impacto en performance
- **Agregaciones** optimizadas

---

## 🎓 **Lecciones Aprendidas Clave**

### **1. Escuchar al Usuario es Crítico**
La pregunta del usuario sobre "¿por qué no una sola tabla?" cambió fundamentalmente la arquitectura hacia algo mucho mejor.

### **2. Simplicidad Gana Sobre Normalización Perfecta**
El esquema "perfectamente normalizado" era un obstáculo para el objetivo real: análisis de flujo de efectivo.

### **3. Realidad del Negocio > Modelos Idealizados**
Entidades híbridas, timing de depósitos, transferencias internas - todo esto debe reflejarse en la arquitectura.

### **4. Migración Completa Temprana es Mejor**
Hacer la refactorización grande ahora evita deuda técnica futura.

### **5. Documentación Durante Desarrollo**
Capturar decisiones y razonamiento en tiempo real es invaluable.

---

**Sesión resultado:** ✅ **Arquitectura Fundamentalmente Mejorada**
**Próxima prioridad:** 🎯 **Frontend Actualizado para Nueva Estructura**