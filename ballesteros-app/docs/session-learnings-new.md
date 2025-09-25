# Aprendizajes y Decisiones Arquitectónicas - Compactado

## 📝 **Sesión: 2025-09-24 - Documentación Actualizada**
**Agregado:** Actualización completa de documentación con avances recientes
**Lección crítica:** Documentar progreso inmediatamente después de cada sesión es crítico para continuidad

---

## 🎯 **Lecciones Críticas de UX**

### **Frontend-Only Filtering - Patrón Superior para Búsquedas**
**Problema:** Pérdida de foco en inputs después de cada carácter al escribir
**Causa raíz:** `setLoading(true)` + llamadas API durante búsqueda → re-renders → pérdida de foco

**Solución implementada:**
```javascript
// ✅ Separar filtros backend de búsqueda frontend
useEffect(() => { cargarDatos() }, [filtroActivo]) // Solo filtros backend
useEffect(() => { cargarDatos() }, []) // Carga inicial
const datosFiltrados = datos.filter(item => search === '' || item.nombre.toLowerCase().includes(search.toLowerCase()))
{datosFiltrados.map((item) => <Card key={item.id}>...)} // Usar array filtrado
```

**Beneficios comprobados:**
- Sin pérdida de foco + búsqueda instantánea + menos tráfico de red + UX superior
**Aplicado:** Todos los módulos (Empleados, Proveedores, Clientes, Categorías, Subcategorías)

### **Error de Render Crítico**
**Problema:** Filtrado funcionaba pero no mostraba resultados
**Error:** `{clientes.map()}` en lugar de `{clientesFiltrados.map()}`
**Aprendizaje:** Siempre verificar que el render usa la variable filtrada correcta

### **shadcn/ui Select Components**
**Problema:** Error "Select.Item must have a value prop that is not empty string"
**Solución:** Usar valores válidos como 'sin-tipo' y convertir a undefined al enviar
**Aprendizaje:** Componentes shadcn/ui requieren valores no vacíos

---

## 🏗️ **Decisiones Arquitectónicas Exitosas**

### **1. Tabla Unificada de Movimientos**
**Pregunta del usuario:** "¿Por qué no una sola tabla de movimientos con es_ingreso y corte_id?"
**Decisión:** Migrar de 8 tablas fragmentadas a 1 tabla unificada
**Ventajas:** 1 consulta vs 4+ queries, cronología unificada, lógica clara
**Aprendizaje:** Simplicidad > Normalización excesiva para análisis de flujo de efectivo

### **2. Entidades Híbridas**
**Realidad del negocio:** Proveedores que también son clientes
**Solución:** Tabla `entidades` con flags múltiples (`es_cliente`, `es_proveedor`, `es_empleado`)
**Casos reales:** Carnicería Los Hermanos = cliente de Principal + proveedor de Express
**Aprendizaje:** El negocio real es más flexible que modelos rígidos de BD

### **3. Sistema de 3 Cuentas**
**Flujo real:** Cajeras → Efectivo Contadora → Cuenta Fiscal
**Implementación:** Tabla `cuentas` con tipos: 'cajera', 'efectivo_contadora', 'fiscal'
**Aprendizaje:** La arquitectura debe reflejar la realidad operativa

### **4. CRUDs Específicos vs Genérico**
**Decisión:** CRUDs separados por tipo con campos específicos
**Ventajas:** UX más natural, validaciones apropiadas, navegación clara
**Aprendizaje:** Especialización por contexto supera a la generalización prematura

### **5. APIs de Compatibilidad**
**Problema:** Mantener frontend funcionando durante migración
**Solución:** `/api/empleados` → wrapper sobre `entidades` con `es_empleado=true`
**Beneficio:** Frontend existente funciona sin cambios
**Aprendizaje:** APIs de compatibilidad facilitan migraciones grandes

---

## 💡 **Insights Críticos del Negocio**

### **Cortes = Solo Totales (No Movimientos Individuales)**
**Malentendido:** Pensábamos que cortes capturaban movimientos individuales
**Realidad:** Cortes solo captura TOTALES manualmente, movimientos van por separado
**Flujo correcto:** Corte (totales) → Validación → Movimientos individuales separados
**Aprendizaje:** El flujo real es más simple que las asunciones técnicas

### **Terminología Precisa Es Crítica**
**Error:** "Venta en Efectivo" vs **Correcto:** "Efectivo en Caja Reportado"
**Error:** Cobranza como venta vs **Correcto:** Cobranza como ingreso (no venta)
**Aprendizaje:** La terminología debe reflejar exactamente el proceso real

### **Lógica de Ingresos vs Egresos**
**Error inicial:** Tarjetas/transferencias = EGRESOS
**Lógica correcta:** Tarjetas/transferencias = INGRESOS (sin efectivo físico)
**Solo egresos reales:** gastos, compras, préstamos, retiros
**Aprendizaje:** Cortesías las paga la empresa, no reducen efectivo

### **Timing del Impacto en Efectivo**
- **Venta efectivo:** Impacto inmediato
- **Venta tarjeta:** Depósito día siguiente
- **Venta plataforma:** Depósito variable + comisión variable
**Aprendizaje:** El timing del impacto en flujo de efectivo es crítico

### **Retiros Parciales = Transferencias (No Pérdidas)**
**Malentendido:** Retiro parcial = dinero perdido
**Realidad:** Transferencia cajera → contadora por seguridad (Total sistema: $0)
**Aprendizaje:** Distinguir entre gastos reales y transferencias internas

### **Plataformas Requieren Conciliación Manual**
**Complejidad:** Depósitos impredecibles, comisiones variables, fechas variables
**Enfoque adoptado:** Registro simple + conciliación posterior manual
**Aprendizaje:** No intentar automatizar lo que es inherentemente impredecible

---

## 🔧 **Problemas Técnicos Resueltos**

### **Next.js 15 Breaking Changes**
**Error:** `{ params }: { params: { id: string } }`
**Solución:** `{ params }: { params: Promise<{ id: string }> }` + `const { id } = await params`

### **Prisma Date Types**
**Error:** `Type "Date" is not built-in`
**Solución:** `DateTime @db.Date` en lugar de `Date`

### **Relaciones Bidireccionales**
**Desafío:** Entidad = empleado que hace movimientos Y cliente que recibe movimientos
**Solución:** Relaciones nombradas `@relation("MovimientoEntidad")` y `@relation("MovimientoEmpleado")`

### **Campos Decimal de Prisma**
**Error:** `corte.venta_neta.toFixed is not a function`
**Causa:** Campos Decimal se serializan como strings en JSON
**Solución:** `Number(corte.venta_neta || 0).toFixed(2)`

### **Jest Worker Errors Críticos**
**Problema:** "Jest worker encountered 2 child process exceptions"
**Impacto:** NextAuth APIs returning 500 errors, login no funcional
**Solución:** `rm -rf .next node_modules/.cache` + servidor en puerto limpio

---

## 🎯 **Lecciones de Implementación**

### **1. Escuchar al Usuario Es Crítico**
La pregunta "¿por qué no una sola tabla?" cambió fundamentalmente la arquitectura hacia algo mejor

### **2. Simplicidad Gana Sobre Normalización Perfecta**
El esquema "perfectamente normalizado" era obstáculo para el objetivo real: análisis de flujo de efectivo

### **3. Realidad del Negocio > Modelos Idealizados**
Entidades híbridas, timing de depósitos, transferencias internas - todo debe reflejarse en arquitectura

### **4. Migración Completa Temprana Es Mejor**
Hacer la refactorización grande temprano evita deuda técnica futura

### **5. Observación Directa > Asunciones**
Reunión con contadora reveló flujo completamente diferente al asumido

### **6. Arquitectura Invisible Es Mejor**
Tabla unificada `entidades` proporciona flexibilidad técnica sin comprometer UX

### **7. Auto-Asignación Reduce Fricción**
Decisiones predecibles (asignación multi-empresa) deben automatizarse

### **8. Navegación Jerárquica Mejora Orientación**
Sistema claro de "Volver" y breadcrumbs reduce desorientación

### **9. Agrupación Visual Mejora Productividad**
Campos relacionados físicamente cerca facilitan captura fluida

### **10. Validación en Tiempo Real Añade Valor**
Cálculos automáticos y panel de validación proporcionan confianza inmediata

---

## 📊 **Métricas de Éxito Logradas**

### **Simplificación**
- Tablas: 13 → 9 (-31%)
- Consultas para resumen: 4+ → 1 (-75%)
- Código API: Estimado -40%

### **Flexibilidad**
- Entidades híbridas: ✅ Soporte completo
- Nuevos tipos movimiento: Sin cambios de schema
- Multi-empresa: Relaciones flexibles

### **Performance**
- Índices estratégicos en campos más consultados
- Joins reducidos: 4+ → 1 en consultas principales
- Filtrado frontend instantáneo sin pérdida de foco

---

---

## 🔄 **Desarrollo de Módulo de Movimientos - Enfoque Definido (2025-09-24)**

### **Contexto Crítico para Futuras Sesiones**

**FORMULARIOS DINÁMICOS:**
- Campos básicos siempre presentes: tipo_movimiento, fecha, importe
- Campos específicos aparecen según tipo seleccionado
- Ejemplo: "préstamo empleado" → lista empleados + cuenta origen + afectación saldos

**DESARROLLO INCREMENTAL:**
- **NO implementar todos los tipos de una vez**
- Liberación movimiento por movimiento según usuario define
- Cada tipo requiere definición específica de campos y lógica

**ESTADO ACTUAL MÓDULO MOVIMIENTOS:**
- ✅ Listado completo con filtros avanzados
- ✅ Botones INGRESO/EGRESO en dashboard
- ✅ "Pago a Proveedor" completamente funcional
- 🚧 Otros tipos pendientes según se vayan definiendo

**PATRÓN DE IMPLEMENTACIÓN:**
1. Usuario define qué tipo de movimiento implementar
2. Se definen campos específicos y validaciones
3. Se implementa lógica de negocio (afectación saldos, etc.)
4. Se prueba y se pasa al siguiente

**IMPORTANTE:** Este enfoque evita repetir el contexto en cada sesión

---

**Estado actual:** Sistema 90% completo - Desarrollo incremental de movimientos en curso
**Lección final:** Documentar inmediatamente después de cada sesión es crítico para continuidad