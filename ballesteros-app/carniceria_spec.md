+----------------------------------------------------------+
|  NUEVO CORTE DE CAJA                          [X Cerrar] |
+----------------------------------------------------------+
|                                                           |
|  ENCABEZADO                                              |
|  Empresa: [Principal v]  Cajero: [Maria v]              |
|  Fecha: [20/09/2025]     Sesion: [1]                    |
|  Tags: [turno-manana maria semana15____________]        |
|                                                           |
|  VENTA NETA (del sistema POS)                           |
|  Venta Neta: [$8,200____]  <- Captura manual            |
|  (La cajera NO puede ver este dato)                     |
|                                                           |
|  VENTAS POR FORMA DE PAGO (informativas)  [+ VENTA]     |
|  --------------------------------------------------------|
|  # | Forma Pago | Monto    | Cliente | Tags             |
|  1 | Efectivo   | $2,500   | -       | -                |
|  2 | Tarjeta    | $3,400   | -       | -                |
|  3 | Credito    | $1,800   | Juan P. | mayoreo          |
|  4 | Transfer   | $500     | -       | -                |
|  --------------------------------------------------------|
|  TOTALES INFORMATIVOS:                                   |
|  Efectivo: $2,500 | Tarjeta: $3,400 |                   |
|  Credito: $1,800  | Transfer: $500                       |
|                                                           |
|  CORTESIAS                          [+ CORTESIA]         |
|  $150 - Seminario                                        |
|  TOTAL: $150                                             |
|                                                           |
|  OTROS INGRESOS                     [+ INGRESO EN TURNO] |
|  Cobranza $300 - Maria Lopez                            |
|  TOTAL: $300                                             |
|                                                           |
|  EGRESOS DEL TURNO                  [- EGRESO EN TURNO]  |
|  Prestamo $200 - Pedro              urgente              |
|  TOTAL: $200                                             |
|                # Especificacion Tecnica - Sistema de Control Financiero para Carniceria

## 1. DESCRIPCION GENERAL

Sistema web para el control financiero de un grupo de 3 empresas relacionadas:
- **Carniceria Principal** (proveedora de las otras dos)
- **Carniceria Express** 
- **Asadero**

**Usuario principal:** Contadora (operacion completa en laptop)  
**Usuarios secundarios:** Duenos (consulta en movil/tablet)

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Estructura Multi-Empresa
- Cada empresa opera de forma independiente
- Comparten catalogos: empleados, categorias de gastos
- La Carniceria Principal vende a credito a Express y Asadero
- Express y Asadero tienen a Principal como proveedor

### 2.2 Plataforma Tecnologica
- **Aplicacion Web Responsive**
- **Desktop/Laptop:** Interfaz completa para registro de datos (Contadora)
- **Movil/Tablet:** Vistas de consulta optimizadas (Duenos)

### 2.3 Roles de Usuario
1. **Contadora:** Acceso completo (crear, editar, eliminar, reportes)
2. **Duenos:** Solo lectura (dashboards, reportes, consultas)

## 3. MODULOS DEL SISTEMA

### 3.1 MODULO: CORTES DE CAJA

**Proposito:** Registro del flujo de efectivo de cada cajera/sesion

**Identificacion del Corte:**
- Empresa (Principal / Express / Asadero)
- Cajero (seleccion de catalogo de empleados)
- Fecha
- Numero de sesion del dia

**Componentes del Corte:**

#### A) VENTA NETA (consulta del sistema POS)
- La contadora consulta la VENTA NETA en el sistema POS/caja registradora
- La cajera NO puede ver este dato (sin privilegios)
- La contadora captura manualmente este monto en el corte
- Este es el total real de ventas del turno segun el sistema

**IMPORTANTE:** La VENTA NETA no se calcula sumando ventas individuales por forma de pago. Es un dato que la contadora obtiene del sistema POS y lo ingresa manualmente.

#### B) VENTAS POR FORMA DE PAGO (informativas)
- Venta en Efectivo
- Venta con Tarjeta
- Venta a Credito (asociado a cliente) (afecta saldos de cliente)
- Venta con Transferencia

**NOTA:** Estas cantidades son informativas/estadisticas. El calculo del efectivo esperado usa la VENTA NETA del sistema POS.
- Se registra la venta (afecta estadisticas)
- NO genera ingreso de efectivo
- Campo de referencia/beneficiario (ej: "Seminario", "Policias")

#### D) OTROS INGRESOS
- Cobranza en efectivo de clientes a credito
- Pagos por transferencia

#### E) EGRESOS DEL TURNO
- Cobranza en efectivo de clientes a credito
- Pagos por transferencia

#### E) EGRESOS DEL TURNO
- Gastos pagados de caja (categoria + monto)
- Compras pagadas de caja (categoria + monto)
- Prestamos a empleados (empleado + monto)
- Retiros parciales de caja

#### F) CUADRE DE CAJA
- Gastos pagados de caja (categoria + monto)
- Compras pagadas de caja (categoria + monto)
- Prestamos a empleados (empleado + monto)
- Retiros parciales de caja

#### F) CUADRE DE CAJA

**Formula:**
```
EFECTIVO QUE DEBE ENTREGAR = 
  (VENTA NETA + Cobranza en efectivo) 
  - (Tarjeta + Creditos + Transferencias + Retiros parciales + Gastos + Compras + Prestamos + Cortesias)
```

**Proceso:**
1. Contadora consulta VENTA NETA en sistema POS (cajera no puede verla)
2. Contadora captura VENTA NETA manualmente en el sistema
3. Sistema calcula automaticamente el efectivo esperado con la formula
4. Contadora captura el efectivo que reporto/entrego la cajera
5. Sistema calcula diferencia

**Registro:**
- VENTA NETA: $______ (captura manual desde sistema POS)
- Efectivo esperado (calculado automaticamente con formula)
- Efectivo real entregado (lo que reporto la cajera)
- Diferencia = Faltante/Sobrante

**Manejo de Diferencias:**
- Si hay diferencia, se intenta aclarar con la cajera
- Si NO se puede aclarar:
  - **FALTANTE:** Se genera un adeudo a la cajera (similar a prestamo)
  - **SOBRANTE:** Se registra como ingreso adicional o se devuelve a cajera

**Integracion:** El efectivo entregado se registra automaticamente como entrada en la Caja de la Contadora

---

### 3.2 MODULO: CAJA DE LA CONTADORA

**Proposito:** Control del flujo diario de efectivo de la contadora

**Nota:** Por confirmar si es una sola caja compartida para las 3 empresas o tres cajas separadas (dejar configurable)

**Estructura Diaria:**

#### SALDO INICIAL
- Saldo del dia anterior (automatico)
- Para el primer dia: captura manual

#### ENTRADAS DE EFECTIVO
- Efectivo de cortes de caja (automatico desde cortes)
- Otros ingresos en efectivo (captura manual)

#### SALIDAS DE EFECTIVO
- Pagos a proveedores en efectivo
- Gastos varios (categoria + monto)
- Nominas (si se pagan en efectivo - por confirmar)
- Prestamos a empleados desde la contadora
- Retiros de los duenos

#### SALDO FINAL
```
SALDO FINAL = SALDO INICIAL + ENTRADAS - SALIDAS
```

---

### 3.3 MODULO: CLIENTES A CREDITO

**Proposito:** Control de cuentas por cobrar

**Catalogo de Clientes:**
- Nombre
- Telefono
- **Clientes especiales en Principal:** "Carniceria Express", "Asadero"

**Movimientos por Cliente:**

#### VENTAS A CREDITO (aumentan saldo)
- Fecha
- Monto
- Origen: corte de caja
- Referencia/concepto

#### PAGOS (disminuyen saldo)
- Fecha
- Monto
- Forma: efectivo, transferencia
- Los pagos NO se vinculan a ventas especificas, se aplican al saldo total
- Pueden pagar parcial o totalmente

**Calculo de Saldo:**
```
SALDO ACTUAL = SALDO INICIAL + VENTAS A CREDITO - PAGOS
```

**Reportes:**
- Reporte general de clientes con saldo actual
- Estado de cuenta individual (historial completo)
- Clientes ordenados por saldo (mayor a menor)

---

### 3.4 MODULO: EMPLEADOS Y PRESTAMOS

**Proposito:** Catalogo de empleados y control de prestamos

**Catalogo de Empleados (compartido entre las 3 empresas):**
- Nombre
- Telefono
- Puesto (lista configurable: Cajero, Supervisor, Carnicero, etc.)
- **Puede operar caja:** Checkbox (Si/No)

**Prestamos a Empleados:**

#### ORIGEN DE PRESTAMOS
- Desde corte de caja (sale del efectivo de cajera)
- Desde caja de contadora

**Adeudos de Cajera por Faltantes:**

#### ORIGEN DE ADEUDOS
- Generados automaticamente desde cortes con diferencias (faltantes)
- Se registran como adeudo de la cajera
- Mismo tratamiento que prestamos pero con origen "Faltante Corte #XXX"

#### ESTRUCTURA DE PRESTAMOS/ADEUDOS
- Empleado (del catalogo)
- Monto
- Fecha
- Tipo: Prestamo / Adeudo por Faltante
- Referencia (# de corte si es adeudo)
- Aumenta saldo deudor del empleado

#### PAGOS/DESCUENTOS
- Empleado (del catalogo)
- Monto prestado
- Fecha
- Aumenta saldo deudor del empleado

#### PAGOS/DESCUENTOS
- Monto
- Fecha
- Forma de pago (efectivo, descuento de nomina - por definir)
- Disminuyen saldo deudor

**Calculo:**
```
SALDO EMPLEADO = (PRESTAMOS + ADEUDOS POR FALTANTES) - PAGOS
```

**Reportes:**
- Lista de empleados con prestamos/adeudos pendientes
- Estado de cuenta por empleado (separando prestamos de adeudos)
- Reporte de cajeras con faltantes acumulados

---

### 3.5 MODULO: PROVEEDORES Y CUENTAS POR PAGAR

**Proposito:** Control de compras y cuentas por pagar

**Catalogo de Proveedores:**
- Nombre del proveedor
- **Proveedores especiales:** 
  - En Express: "Carniceria Principal"
  - En Asadero: "Carniceria Principal"

**Compras/Gastos a Credito:**
- Proveedor (del catalogo)
- Fecha de compra
- Monto
- Categoria (Compra de carne, Servicios, etc.)
- Subcategoria (Res, Cerdo, Pollo / Luz, Agua, etc.)
- Peso/cantidad (opcional para carne)
- Numero de nota/factura
- **Fecha de vencimiento**
- Estado: Pendiente / Parcialmente pagado / Pagado

**Pagos a Proveedores:**
- Proveedor
- Monto del pago
- **Forma de pago:**
  - Transferencia (mayoria de casos)
  - Efectivo (desde caja contadora)
- **Referencia** (para agrupar varias facturas en un pago)
- Fecha de pago
- Se aplica al saldo del proveedor (puede cubrir una o varias facturas)
- Permite **pagos parciales**

**Compras de Contado:**
- Se registran directamente como egreso en el corte de caja o caja contadora
- NO generan cuenta por pagar

**Reportes:**
1. Listado de proveedores con deuda total
2. Vencimientos del dia/periodo
3. Cuentas por pagar por proveedor (detalle de facturas pendientes)
4. Historico de compras por proveedor
5. Analisis de compras por categoria
6. Estado de cuenta por proveedor (compras y pagos)

---

### 3.6 MODULO: CATEGORIAS DE GASTOS/COMPRAS

**Proposito:** Clasificacion de egresos (compartido entre las 3 empresas)

**Estructura sugerida:**

#### COMPRAS
- Carne: Res, Cerdo, Pollo, Pescado, Otros
- Insumos: Bolsas, Charolas, Etiquetas, Limpieza

#### SERVICIOS
- Luz
- Agua
- Gas
- Internet
- Telefono
- Renta

#### MANTENIMIENTO
- Equipo
- Local
- Refrigeracion
- Vehiculos

#### PERSONAL
- Nominas
- Prestamos a empleados

#### OTROS
- Retiros de duenos
- Gastos varios

**Nota:** Las categorias y subcategorias deben ser configurables/editables

---

## 4. REPORTES Y CONSULTAS

### 4.1 Reportes Individuales (por empresa)
- Ventas del dia/periodo
- Gastos del dia/periodo por categoria
- Estado de caja
- Utilidad (ventas - gastos)
- Diferencias en cortes (faltantes/sobrantes) por cajero
- Historico de cortes

### 4.2 Reportes Consolidados (las 3 empresas)
- Ventas totales del grupo
- Gastos totales
- Utilidad consolidada
- **IMPORTANTE:** Eliminar operaciones inter-empresas (ventas de Principal a Express/Asadero) para evitar duplicacion
- Comparativo de desempeno por empresa

### 4.3 Reportes por Modulo
Ya definidos en cada modulo (ver secciones 3.3 a 3.6)

### 4.4 Dashboard para Duenos (movil/tablet)
- Metricas del dia por empresa
- Ventas y gastos
- Alertas de vencimientos
- Estado de cuentas principales
- Graficos de tendencias

---

## 5. FLUJOS OPERATIVOS PRINCIPALES

### 5.1 Flujo Diario de la Contadora

**Manana siguiente al cierre:**
1. La cajera entrega reporte fisico/verbal del corte
2. La contadora ingresa al sistema
3. La contadora **consulta la VENTA NETA en el sistema POS** (la cajera no tiene acceso a este dato)
4. Selecciona empresa y captura corte de caja:
   - **Captura manualmente la VENTA NETA** del sistema POS
   - Ventas por forma de pago (informativas)
   - Cobranza
   - Gastos/compras del turno
   - Prestamos
   - Cortesias
   - Efectivo entregado (reportado por cajera)
5. Sistema calcula automaticamente:
   - Efectivo esperado (usando VENTA NETA + cobranza - egresos)
   - Diferencia (efectivo esperado vs efectivo real)
6. Si hay diferencia:
   - Intenta aclarar con cajera
   - Si no se aclara: genera adeudo a cajera (faltante) o registra sobrante
7. Registra otros movimientos de su caja (pagos, gastos)
8. Revisa saldo de caja y reportes

### 5.2 Flujo de Ventas Inter-Empresas

**Carniceria Principal -> Express/Asadero:**
1. Principal registra venta a credito
2. Cliente: "Carniceria Express" o "Asadero"
3. Genera cuenta por cobrar en Principal
4. En Express/Asadero se registra como:
   - Proveedor: "Carniceria Principal"
   - Cuenta por pagar
   - Fecha de vencimiento

### 5.3 Flujo de Pago a Proveedores
1. Consultar vencimientos del dia/periodo
2. Seleccionar proveedor
3. Ver facturas pendientes
4. Registrar pago:
   - Monto (puede ser parcial)
   - Forma (transferencia o efectivo)
   - Referencia (si agrupa varias facturas)
5. Si es efectivo -> sale de caja contadora
6. Actualiza saldo del proveedor

---

## 6. CONFIGURACION INICIAL DEL SISTEMA

### 6.1 Datos Maestros a Configurar
- Lista de empresas (Principal, Express, Asadero)
- Catalogo de empleados
- Catalogo de categorias/subcategorias de gastos
- Catalogo de proveedores
- Catalogo de clientes

### 6.2 Saldos Iniciales (captura manual)
- Caja de contadora: saldo inicial en efectivo
- Clientes con saldo pendiente
- Proveedores con deuda pendiente  
- Empleados con prestamos pendientes

### 6.3 Configuraciones Pendientes de Confirmar
- [ ] Nominas: se pagan en efectivo o transferencia?
- [ ] Caja contadora: una compartida o tres separadas?
- [ ] Nivel de detalle de saldos historicos en migracion

---

## 7. CONSIDERACIONES TECNICAS

### 7.1 Seguridad
- Autenticacion de usuarios (login/password)
- Roles y permisos (Contadora vs Duenos)
- Backup automatico de datos

### 7.2 Validaciones Importantes
- No permitir fechas futuras en transacciones
- Validar que efectivo entregado sea numero positivo
- Prevenir eliminacion de registros con impacto financiero
- Confirmar acciones criticas (eliminaciones, pagos grandes)

### 7.3 Interfaz de Usuario Simplificada

#### FILOSOFIA: INTERFAZ DE DOS NIVELES

**NIVEL 1: OPERACION DIARIA - DOS BOTONES PRINCIPALES**

**Para movimientos fuera del corte:**

**BOTON: [+ INGRESO]**
- Al presionar, aparece selector de tipo de ingreso:
  1. **Cobranza Cliente** -> campos: cliente, monto, fecha, forma de pago, tags
  2. **Pago de Proveedor (a nosotros)** -> campos: proveedor, monto, fecha, tags
  3. **Ingreso Varios** -> campos: concepto, monto, fecha, categoria, tags
  4. **Deposito/Entrada Efectivo** -> campos: monto, origen, fecha, tags

**BOTON: [- EGRESO]**
- Al presionar, aparece selector de tipo de egreso:
  1. **Pago a Proveedor** -> campos: proveedor, monto, forma pago, referencia de facturas, tags
  2. **Gasto** -> campos: categoria, subcategoria, monto, fecha, forma pago, tags
  3. **Compra de Contado** -> campos: proveedor, categoria, monto, fecha, forma pago, tags
  4. **Prestamo Empleado** -> campos: empleado, monto, fecha, tags
  5. **Retiro Dueno** -> campos: monto, nombre, fecha, forma pago, tags
  6. **Retiro/Salida Efectivo** -> campos: monto, destino, fecha, tags

---

**NIVEL 2: MODULO DE CORTE DE CAJA**

**BOTON ESPECIAL: [NUEVO CORTE]**

Al presionar, abre el modulo completo de corte con:

**A) ENCABEZADO DEL CORTE:**
- Empresa (selector)
- Cajero (selector del catalogo)
- Fecha
- Numero de sesion
- Tags del corte (ej: `turno-manana`, `maria`, `semana15`)

**B) VENTA NETA** (dato del sistema POS)
- Campo para captura manual: $______
- La contadora consulta este dato en el sistema POS
- La cajera NO puede ver este dato (sin privilegios)
- Este monto se usa para el calculo del efectivo esperado

**C) VENTAS POR FORMA DE PAGO** (informativas/estadisticas)

*Opcion 1 - Captura de Totales:*
- Venta Efectivo: $______
- Venta Tarjeta: $______
- Venta Credito: $______
- Venta Transferencia: $______

*Opcion 2 - Captura Individual (RECOMENDADO):*

**[+ VENTA]** -> Mini-formulario:
- Forma de pago: [Efectivo/Tarjeta/Credito/Transferencia]
- Monto: $______
- Cliente (solo si es credito)
- Tags (opcional): `ticket123`, `mayoreo`, etc.

Sistema suma automaticamente y muestra:
- **Total Ventas Efectivo:** $X,XXX
- **Total Ventas Tarjeta:** $X,XXX
- **Total Ventas Credito:** $X,XXX
- **Total Ventas Transferencia:** $X,XXX

**NOTA:** Estos totales son informativos. El calculo usa la VENTA NETA del paso B.

**D) VENTAS DE CORTESIA**

**[+ CORTESIA]** -> cada cortesia individual:
- Monto: $______
- Beneficiario/Referencia: _______
- Tags: `seminario`, `policia`, etc.

Lista de cortesias registradas con total

**E) OTROS INGRESOS DEL TURNO**

**[+ INGRESO EN TURNO]** -> tipo:
- **Cobranza Efectivo:** cliente, monto, tags
- **Pago por Transferencia:** cliente, monto, tags

Totales automaticos por tipo

**F) EGRESOS DEL TURNO**

**[+ INGRESO EN TURNO]** -> tipo:
- **Cobranza Efectivo:** cliente, monto, tags
- **Pago por Transferencia:** cliente, monto, tags

Totales automaticos por tipo

**F) EGRESOS DEL TURNO**

**[- EGRESO EN TURNO]** -> tipo:
- **Gasto:** categoria, monto, concepto, tags
- **Compra:** proveedor, categoria, monto, tags
- **Prestamo Empleado:** empleado, monto, tags
- **Retiro Parcial:** monto, destino, tags

Lista de cada egreso con totales por tipo

**G) CUADRE FINAL**

**[- EGRESO EN TURNO]** -> tipo:
- **Gasto:** categoria, monto, concepto, tags
- **Compra:** proveedor, categoria, monto, tags
- **Prestamo Empleado:** empleado, monto, tags
- **Retiro Parcial:** monto, destino, tags

Lista de cada egreso con totales por tipo

**G) CUADRE FINAL**

Sistema calcula automaticamente usando la VENTA NETA capturada:
```
EFECTIVO ESPERADO = 
  (VENTA NETA + Cobranza Efectivo) 
  - (Tarjeta + Creditos + Transferencias + Retiros parciales + Gastos + Compras + Prestamos + Cortesias)
```

Campos finales:
- **Efectivo Esperado:** $XX,XXX (automatico)
- **Efectivo Real Entregado:** $______ (manual - lo que reporto cajera)
- **DIFERENCIA:** $XXX (Faltante/Sobrante) - en rojo/verde

**Manejo de Diferencias:**
- Si hay diferencia: opciones para aclarar o generar adeudo
- **[GENERAR ADEUDO A CAJERA]** - si faltante no se aclara
- **[REGISTRAR SOBRANTE]** - si sobrante no se aclara

**H) RESUMEN DEL CORTE**

Sistema calcula automaticamente:
```
EFECTIVO QUE DEBE ENTREGAR = 
  (VENTA NETA + Cobranza Efectivo) 
  - (Tarjeta + Creditos + Transferencias + Retiros parciales + Gastos + Compras + Prestamos + Cortesias)
```

Campos finales:
- **Efectivo Esperado:** $XX,XXX (automatico)
- **Efectivo Real Entregado:** $______ (manual)
- **DIFERENCIA:** $XXX (Faltante/Sobrante) - en rojo/verde

**H) RESUMEN DEL CORTE**

Vista consolidada mostrando:
- VENTA NETA (del sistema POS)
- Totales de ventas por forma de pago (informativos)
- Totales de ingresos del turno
- Totales de egresos del turno
- Lista completa de todos los movimientos individuales con sus tags
- Resultado del cuadre
- Adeudos generados (si hay faltantes sin aclarar)

**[GUARDAR CORTE]** -> 
- Registra todas las transacciones individuales
- Efectivo entregado va a Caja de Contadora
- Todas las ventas, gastos, prestamos quedan registrados individualmente
- Adeudos de cajera se registran en su cuenta (similar a prestamos)
- Permite consultar detalle completo despues

Vista consolidada mostrando:
- Totales de ventas por forma de pago
- Totales de ingresos del turno
- Totales de egresos del turno
- Lista completa de todos los movimientos individuales con sus tags
- Resultado del cuadre

**[GUARDAR CORTE]** -> 
- Registra todas las transacciones individuales
- Efectivo entregado va a Caja de Contadora
- Todas las ventas, gastos, prestamos quedan registrados individualmente
- Permite consultar detalle completo despues

---

**CONSULTA DE CORTES:**

**Menu: CORTES DE CAJA**
- Lista de cortes con filtros:
  - Por empresa
  - Por cajero
  - Por fecha/periodo
  - Por tags
  - Por estado (con/sin diferencias)

Al hacer clic en un corte:
- Ver detalle completo
- Todas las ventas individuales
- Todos los gastos individuales
- Todos los movimientos con tags
- Totales y cuadre
- Opcion de imprimir/exportar

---

**SISTEMA DE TAGS/ETIQUETAS:**
- **Todos los movimientos** tienen campo "Tags/Referencias"
- Campo de texto libre: palabras clave separadas por espacios o comas
- A nivel de corte: tags generales (`turno-manana`, `maria`)
- A nivel de cada transaccion: tags especificos (`factura123`, `urgente`, `reparacion`)
- Sistema de busqueda global que encuentra en cortes y movimientos individuales
- Sugerencias de tags usados anteriormente (autocompletar)
- Permite combinar multiples tags en busquedas

**VENTAJAS DE ESTE DISENO:**
1. Mantiene la estructura completa del corte
2. Cada movimiento se registra individualmente
3. Calculos automaticos de totales
4. Interfaz consistente con botones [+ INGRESO] / [- EGRESO]
5. Tags a nivel general (corte) y especifico (transaccion)
6. Trazabilidad completa de cada operacion
7. Consultas detalladas posteriores
8. Flexibilidad para analisis por tags

**NAVEGACION PRINCIPAL:**
```
[Selector de Empresa: Principal / Express / Asadero / Consolidado]

Dashboard
  [NUEVO CORTE]
  [+ INGRESO]  [- EGRESO]
  
  -> Cortes del dia/pendientes
  -> Ultimos movimientos (con tags visibles)
  -> Busqueda por tags
  -> Saldo actual de caja
  -> Alertas y pendientes

Cortes de Caja
  -> Lista de cortes
  -> Filtros avanzados
  -> Busqueda por tags
  -> Reportes de diferencias

Reportes
  -> Por empresa/consolidados
  -> Por periodo/tags/categorias
  -> Estados de cuenta
```

**Movil (Duenos):**
- Cards con informacion resumida
- Graficos tactiles
- Navegacion simplificada
- Vista de tags mas usados
- Filtros rapidos por tags

### 7.4 Integraciones Futuras (Fase 2)
- Importacion desde Excel
- Exportacion de reportes (PDF, Excel)
- Notificaciones automaticas de vencimientos
- Dashboard en tiempo real

---

## 8. ESTRATEGIA DE IMPLEMENTACION

### Fase 1 - MVP (Producto Minimo Viable)
**Prioridad Alta:**
- Modulo de cortes de caja
- Caja de contadora
- Clientes a credito (basico)
- Proveedores y cuentas por pagar
- Reportes esenciales por empresa

**Funcionalidades Core:**
- Registro manual de todas las transacciones
- Calculos automaticos de saldos
- Reportes basicos individuales

### Fase 2 - Mejoras y Ajustes
- Feedback de uso real
- Reportes consolidados
- Dashboard para duenos
- Optimizaciones de interfaz

### Fase 3 - Funcionalidades Avanzadas
- Graficos y analisis
- Exportaciones
- Notificaciones
- Integracion con sistemas externos

---

## 9. CASOS DE USO PRINCIPALES

### CU-01: Registrar Corte de Caja Completo
**Actor:** Contadora  
**Flujo:**
1. Presionar **[NUEVO CORTE]**
2. Llenar encabezado:
   - Seleccionar empresa
   - Seleccionar cajero
   - Fecha y sesion
   - Tags generales del corte
3. **Capturar VENTA NETA:**
   - Consultar VENTA NETA en sistema POS
   - Ingresar monto manualmente en el campo
4. **Registrar Ventas por Forma de Pago** (informativas):
   - Presionar **[+ VENTA]** por cada tipo
   - Estos datos son estadisticos, no afectan el calculo
5. **Registrar Cortesias:**
   - Presionar **[+ CORTESIA]** 
   - Monto y beneficiario
   - Tags
6. **Registrar Otros Ingresos:**
   - Presionar **[+ INGRESO EN TURNO]**
   - Tipo (cobranza/transferencia)
   - Detalles y tags
7. **Registrar Egresos del Turno:**
   - Presionar **[- EGRESO EN TURNO]**
   - Tipo (gasto/compra/prestamo/retiro)
   - Detalles y tags
8. **Cuadre Final:**
   - Sistema calcula efectivo esperado usando VENTA NETA
   - Ingresar efectivo real entregado (reportado por cajera)
   - Ver diferencia (faltante/sobrante)
9. **Manejo de Diferencias:**
   - Si hay faltante sin aclarar: **[GENERAR ADEUDO A CAJERA]**
   - Si hay sobrante: registrar o devolver
10. Revisar resumen completo
11. **[GUARDAR CORTE]**
   - Todos los movimientos se registran
   - Adeudos quedan en cuenta de cajera
   - Efectivo va a Caja Contadora

### CU-02: Consultar Detalle de Corte
**Actor:** Contadora o Dueno  
**Flujo:**
1. Ir a **CORTES DE CAJA**
2. Filtrar por:
   - Empresa
   - Cajero
   - Fecha/periodo
   - Tags
3. Seleccionar corte de la lista
4. Ver detalle completo:
   - Encabezado (cajero, fecha, tags)
   - **Cada venta individual** con su forma de pago y tags
   - **Cada cortesia** con beneficiario
   - **Cada ingreso** del turno
   - **Cada egreso** del turno
   - Totales por categoria
   - Resultado del cuadre
5. Opciones:
   - Imprimir
   - Exportar
   - Buscar dentro del corte por tags

### CU-03: Registrar Ingreso (fuera de corte)
**Actor:** Contadora  
**Flujo:**
1. Presionar boton **[+ INGRESO]**
2. Seleccionar tipo de ingreso del menu
3. Formulario dinamico muestra campos relevantes
4. Llenar informacion requerida
5. Agregar tags/palabras clave
6. Guardar
7. Sistema actualiza automaticamente saldos

### CU-04: Registrar Egreso (fuera de corte)
**Actor:** Contadora  
**Flujo:**
1. Presionar boton **[- EGRESO]**
2. Seleccionar tipo de egreso
3. Formulario dinamico muestra campos segun tipo
4. Llenar informacion
5. Agregar tags descriptivos
6. Confirmar
7. Sistema actualiza saldos y registros

### CU-05: Buscar Movimientos por Tags (incluyendo dentro de cortes)
**Actor:** Contadora o Dueno  
**Flujo:**
1. Ir a busqueda global
2. Escribir tags: `urgente maria semana15`
3. Seleccionar alcance:
   - Solo cortes
   - Solo movimientos individuales
   - Todo (cortes + movimientos)
4. Tipo de busqueda:
   - TODOS los tags (AND)
   - CUALQUIER tag (OR)
5. Ver resultados:
   - Cortes completos que coinciden
   - Movimientos individuales (incluso dentro de cortes)
6. Hacer clic en resultado para ver detalle
7. Opciones: exportar o guardar busqueda

---

## 10. MODELO DE DATOS SIMPLIFICADO

### Entidades Principales

**EMPRESA**
- id, nombre, activa

**EMPLEADO** (compartido)
- id, nombre, telefono, puesto, puede_operar_caja

**CLIENTE** (por empresa)
- id, empresa_id, nombre, telefono, saldo_inicial

**PROVEEDOR** (por empresa)
- id, empresa_id, nombre

**CATEGORIA_GASTO** (compartido)
- id, nombre, tipo (compra/servicio/mantenimiento/etc)

**SUBCATEGORIA_GASTO** (compartido)
- id, categoria_id, nombre

**CORTE_CAJA**
- id, empresa_id, empleado_id, fecha, sesion
- **venta_neta** (captura manual desde sistema POS)
- efectivo_esperado (calculado), efectivo_real, diferencia
- tags (etiquetas generales del corte)
- estado, adeudo_generado (boolean)

**VENTA_CORTE** (cada venta individual - informativa)
- id, corte_id, forma_pago (efectivo/tarjeta/credito/transferencia)
- monto, cliente_id (si es credito), tags, timestamp
- **NOTA:** Solo para estadisticas, no se usa en calculo de efectivo esperado

**CORTESIA_CORTE**
- id, corte_id, monto, beneficiario, tags

**INGRESO_TURNO** (ingresos durante el turno)
- id, corte_id, tipo (cobranza_efectivo/transferencia), 
- monto, cliente_id, tags

**EGRESO_TURNO** (egresos durante el turno)
- id, corte_id, tipo (gasto/compra/prestamo/retiro),
- monto, relacionado_id (empleado/proveedor segun tipo),
- categoria_id, subcategoria_id, tags

**TOTALES_CORTE** (tabla resumen, se calcula automaticamente)
- id, corte_id
- total_venta_efectivo, total_venta_tarjeta, total_venta_credito, total_venta_transferencia
- total_cobranza, total_cortesias
- total_gastos, total_compras, total_prestamos, total_retiros
- venta_neta

**MOVIMIENTO_GENERAL** (movimientos fuera de cortes)
- id, empresa_id, tipo_movimiento (ingreso/egreso), subtipo
- fecha, monto, forma_pago
- **tags** (campo de texto para etiquetas)
- descripcion, referencia
- relacionado_con_id (cliente/proveedor/empleado segun caso)
- categoria_id, subcategoria_id (si aplica)
- afecta_caja (boolean), estado

**CAJA_CONTADORA** (por empresa o compartida)
- id, empresa_id, fecha, saldo_inicial, saldo_final

**MOVIMIENTO_CLIENTE**
- id, cliente_id, tipo (venta/pago), fecha, monto, referencia

**MOVIMIENTO_EMPLEADO_PRESTAMO**
- id, empleado_id, tipo (prestamo/pago/adeudo_faltante), fecha, monto, origen
- corte_id (si es adeudo por faltante), referencia

**CUENTA_POR_PAGAR**
- id, proveedor_id, fecha_compra, monto, categoria_id, subcategoria_id,
- numero_factura, fecha_vencimiento, peso_cantidad, estado, saldo_pendiente

**PAGO_PROVEEDOR**
- id, proveedor_id, fecha, monto, forma_pago, referencia

---

## 11. GLOSARIO DE TERMINOS

- **Corte de Caja:** Proceso de cuadre del efectivo de una cajera al final de su sesion
- **Sesion:** Periodo de trabajo de una cajera en un dia (puede haber multiples sesiones)
- **Venta Neta:** Suma total de todas las ventas registradas en un corte
- **Cortesia:** Venta que no genera ingreso (la empresa asume el costo)
- **Cobranza:** Pago recibido de clientes que tenian saldo a credito
- **Cuenta por Cobrar:** Dinero que los clientes deben a la empresa
- **Cuenta por Pagar:** Dinero que la empresa debe a proveedores
- **Consolidado:** Reporte que combina datos de las 3 empresas
- **Inter-empresa:** Operaciones entre las empresas del grupo
- **Tags/Etiquetas:** Palabras clave libres que se asignan a cualquier movimiento para facilitar busquedas futuras
- **Movimiento:** Cualquier transaccion financiera (ingreso o egreso) registrada en el sistema
- **Formulario Dinamico:** Interfaz que muestra diferentes campos segun el tipo de movimiento seleccionado

---

## NOTAS FINALES

Este documento es la especificacion base para desarrollo. Se espera iteracion y ajustes durante la implementacion segun:
- Feedback de la contadora al usar el sistema
- Necesidades especificas que surjan en operacion real
- Optimizaciones tecnicas identificadas

**Estrategia:** Desarrollar MVP funcional -> Probar -> Ajustar -> Expandir

**Proximos pasos:**
1. Confirmar configuraciones pendientes (caja contadora, nominas)
2. Desarrollo de MVP
3. Pruebas con datos reales
4. Ajustes basados en uso
5. Expansion de funcionalidades

---

## ANEXO A: EJEMPLOS DE FLUJO DE TRABAJO

### Ejemplo 1: Dia Tipico de la Contadora

**8:00 AM - Llega la contadora**
- Login al sistema
- Selecciona empresa: Carniceria Principal
- Ve dashboard con saldo de caja del dia anterior

**8:30 AM - Llega reporte de cajera (turno matutino del dia anterior)**
- Presiona [NUEVO CORTE]
- Llena encabezado: Maria, 20/09/2025, Sesion 1, tags: `turno-manana`
- **IMPORTANTE: Consulta VENTA NETA en sistema POS: $8,200**
- **Captura VENTA NETA manualmente: $8,200**
- Registra ventas por forma de pago (informativas):
  - [+ VENTA] Efectivo $2,500
  - [+ VENTA] Tarjeta $3,400
  - [+ VENTA] Credito $1,800 - Cliente: Juan Perez
  - [+ VENTA] Transferencia $500
- Registra [+ CORTESIA] $150 - Seminario
- Registra [+ INGRESO EN TURNO] Cobranza $300 - Maria Lopez
- Registra [- EGRESO EN TURNO] Prestamo $200 - Pedro
- Sistema calcula usando VENTA NETA: Efectivo esperado $8,350
- Ingresa: Efectivo real reportado por cajera $8,330
- Sistema muestra: FALTANTE $20
- Intenta aclarar con cajera
- No se puede aclarar -> [GENERAR ADEUDO A CAJERA]
- [GUARDAR CORTE]
- Se crea adeudo de $20 en cuenta de Maria

**9:00 AM - Revisa vencimientos de proveedores**
- Menu: Cuentas por Pagar
- Filtro: Vencimientos de hoy
- Ve lista de facturas a pagar
- Decide pagar a Proveedor "Carnes del Norte"
- [- EGRESO] -> Pago a Proveedor
- Proveedor: Carnes del Norte
- Monto: $15,000
- Forma: Transferencia
- Referencia: `facturas 001-005 semana15`
- Tags: `carne urgente`
- Confirma

**10:00 AM - Registro de gastos varios**
- [- EGRESO] -> Gasto
- Categoria: Servicios -> Luz
- Monto: $2,500
- Forma: Transferencia
- Tags: `luz septiembre`

**11:00 AM - Consulta estado de cliente**
- Menu: Clientes a Credito
- Busca: Carniceria Express
- Ve estado de cuenta con todas las compras y pagos
- Saldo actual: $25,000

**12:00 PM - Genera reporte para duenos**
- Menu: Reportes
- Selecciona: Consolidado - Ventas del mes
- Sistema muestra ventas de las 3 empresas
- Exporta PDF

### Ejemplo 2: Busqueda por Tags

**Caso: Necesita encontrar todos los gastos urgentes de la semana 15**
- Va a busqueda global
- Escribe tags: `urgente semana15`
- Selecciona tipo: TODOS los tags (AND)
- Selecciona alcance: Todo
- Resultados muestran:
  - Pago a proveedor $15,000 (del ejemplo anterior)
  - Corte #45 que tenia tag `urgente`
  - Gasto de reparacion $800 con esos tags
- Puede exportar lista o ver detalle de cada uno

### Ejemplo 3: Flujo Inter-Empresas

**Carniceria Principal vende a Express:**
1. En sistema de Principal:
   - [NUEVO CORTE] o [+ INGRESO] -> Cobranza Cliente
   - O durante corte: [+ VENTA] Credito
   - Cliente: Carniceria Express
   - Monto: $10,000
   - Tags: `express pedido123`
   - Guarda

2. En sistema de Express:
   - [- EGRESO] -> Compra de Contado (si paga inmediato)
   - O Menu: Cuentas por Pagar -> Nueva Compra a Credito
   - Proveedor: Carniceria Principal
   - Monto: $10,000
   - Vencimiento: 30/09/2025
   - Tags: `principal pedido123`

3. Cuando Express paga:
   - [- EGRESO] -> Pago a Proveedor
   - Proveedor: Carniceria Principal
   - Monto: $10,000
   - Forma: Transferencia
   - Referencia: `pedido123`

4. En Principal:
   - [+ INGRESO] -> Cobranza Cliente
   - Cliente: Carniceria Express
   - Monto: $10,000
   - Tags: `pedido123 pagado`

---

## ANEXO B: WIREFRAMES CONCEPTUALES

### Pantalla Principal (Dashboard)
```
+----------------------------------------------------------+
|  [Logo] Sistema Financiero          [Empresa: Principal v] |
|                                     [Usuario: Contadora]  |
+----------------------------------------------------------+
|                                                           |
|  SALDO DE CAJA: $45,350                                  |
|                                                           |
|  +----------------+  +----------------+  +-------------+ |
|  | [NUEVO CORTE] |  | [+ INGRESO]   |  | [- EGRESO]  | |
|  +----------------+  +----------------+  +-------------+ |
|                                                           |
|  ALERTAS:                                                |
|  ! 3 facturas vencen hoy                                |
|  ! Corte #45 con faltante de $20                        |
|                                                           |
|  ULTIMOS MOVIMIENTOS:                                    |
|  ------------------------------------------------------- |
|  20/09 | Corte #45 | Maria | Faltante $20              |
|  20/09 | Pago Prov | Carnes Norte | -$15,000 | urgente   |
|  20/09 | Gasto | Luz | -$2,500 | septiembre             |
|  ------------------------------------------------------- |
|                                                           |
|  [Ver mas movimientos] [Buscar por tags]                |
+----------------------------------------------------------+
```

### Pantalla Nuevo Corte
```
+----------------------------------------------------------+
|  NUEVO CORTE DE CAJA                          [X Cerrar] |
+----------------------------------------------------------+
|                                                           |
|  ENCABEZADO                                              |
|  Empresa: [Principal v]  Cajero: [Maria v]              |
|  Fecha: [20/09/2025]     Sesion: [1]                    |
|  Tags: [turno-manana maria semana15____________]        |
|                                                           |
|  VENTAS                              [+ VENTA]           |
|  --------------------------------------------------------|
|  # | Forma Pago | Monto    | Cliente | Tags             |
|  1 | Efectivo   | $500     | -       | -                |
|  2 | Tarjeta    | $1,200   | -       | ticket45         |
|  3 | Credito    | $800     | Juan P. | mayoreo          |
|  --------------------------------------------------------|
|  TOTALES: Efectivo: $2,500 | Tarjeta: $3,400 |          |
|           Credito: $1,800  | Transfer: $500             |
|  VENTA NETA: $8,200                                      |
|                                                           |
|  CORTESIAS                          [+ CORTESIA]         |
|  $150 - Seminario                                        |
|  TOTAL: $150                                             |
|                                                           |
|  OTROS INGRESOS                     [+ INGRESO EN TURNO] |
|  Cobranza $300 - Maria Lopez                            |
|  TOTAL: $300                                             |
|                                                           |
|  EGRESOS DEL TURNO                  [- EGRESO EN TURNO]  |
|  Prestamo $200 - Pedro              urgente              |
|  TOTAL: $200                                             |
|                                                           |
|  CUADRE FINAL                                            |
|  Efectivo Esperado: $2,370                               |
|  Efectivo Real:     [_______]                            |
|  Diferencia:        $_____ (calculado al escribir)       |
|                                                           |
|  [Ver Resumen]              [GUARDAR CORTE]              |
+----------------------------------------------------------+
```

### Pantalla Busqueda por Tags
```
+----------------------------------------------------------+
|  BUSQUEDA AVANZADA                                       |
+----------------------------------------------------------+
|                                                           |
|  Tags a buscar: [urgente semana15________________]       |
|                                                           |
|  Tipo: ( ) Todos (AND)  (•) Cualquiera (OR)             |
|                                                           |
|  Alcance: [•] Todo  [ ] Solo cortes  [ ] Solo movimientos|
|                                                           |
|  Filtros adicionales:                                    |
|  Fecha desde: [____] hasta: [____]                       |
|  Empresa: [Todas v]                                      |
|  Tipo movimiento: [Todos v]                              |
|                                                           |
|  [BUSCAR]                                                |
|                                                           |
|  RESULTADOS (3 encontrados):                             |
|  --------------------------------------------------------|
|  20/09 | PAGO PROV | Carnes Norte | -$15,000            |
|        | Tags: urgente, semana15, carne                  |
|  [Ver detalle] [Exportar]                                |
|  --------------------------------------------------------|
|  19/09 | CORTE #45 | Maria | Faltante $20                |
|        | Tags: urgente, semana15, turno-tarde            |
|  [Ver corte completo]                                    |
|  --------------------------------------------------------|
|  18/09 | GASTO | Reparacion | -$800                      |
|        | Tags: urgente, semana15, refrigerador           |
|  [Ver detalle]                                           |
|  --------------------------------------------------------|
|                                                           |
|  [Exportar todos] [Guardar busqueda]                    |
+----------------------------------------------------------+
```

---

## ANEXO C: VALIDACIONES Y REGLAS DE NEGOCIO

### Validaciones Generales
1. **Fechas:**
   - No permitir fechas futuras en transacciones
   - Alertar si fecha es muy antigua (>30 dias)
   - Formato: DD/MM/YYYY

2. **Montos:**
   - Solo numeros positivos
   - Maximo 2 decimales
   - Alertar si monto es muy alto (>$100,000)

3. **Selecciones:**
   - Cliente es obligatorio en ventas a credito
   - Proveedor es obligatorio en pagos
   - Categoria es obligatoria en gastos

### Reglas de Negocio del Corte

1. **Venta Neta:**
   - Debe ser > 0 para guardar corte
   - Se calcula automaticamente sumando todas las ventas

2. **Efectivo Esperado:**
   - Formula siempre visible
   - Se recalcula en tiempo real al agregar/quitar items

3. **Diferencia:**
   - Faltante en ROJO
   - Sobrante en VERDE
   - Si diferencia > $100, pedir confirmacion adicional

4. **Guardar Corte:**
   - Requiere al menos 1 venta
   - Requiere efectivo real entregado
   - Al guardar, todos los movimientos se registran individualmente
   - El efectivo entregado se suma a caja de contadora

### Reglas de Cuentas por Cobrar/Pagar

1. **Pagos:**
   - No pueden exceder saldo pendiente
   - Si pago > saldo, alertar y pedir confirmacion
   - Actualizar estado de cuenta automaticamente

2. **Vencimientos:**
   - Alertar 3 dias antes del vencimiento
   - Marcar en rojo facturas vencidas
   - Dashboard muestra total de vencimientos del dia

3. **Clientes/Proveedores Especiales:**
   - "Carniceria Express" y "Asadero" siempre a credito en Principal
   - "Carniceria Principal" como proveedor en Express/Asadero
   - No permitir eliminar estos registros especiales

### Reglas de Reportes Consolidados

1. **Eliminacion de Duplicados:**
   - Al consolidar, eliminar ventas de Principal a Express/Asadero
   - No contar 2 veces el mismo dinero
   - Mostrar nota explicativa en reporte

2. **Totales:**
   - Sumar ventas externas solamente
   - Gastos si se suman todos
   - Cuentas por pagar solo a externos

---

## ANEXO D: MENSAJES Y TEXTOS DEL SISTEMA

### Mensajes de Confirmacion
- "Corte guardado exitosamente. Efectivo de $X,XXX agregado a caja de contadora."
- "Pago registrado. Saldo pendiente del proveedor: $X,XXX"
- "Cliente agregado al sistema."
- "Busqueda guardada como 'urgentes-semana15'"

### Mensajes de Alerta
- "ATENCION: Diferencia de $500 en corte. ¿Confirmar de todos modos?"
- "3 facturas vencen hoy por $25,000 en total"
- "El pago excede el saldo pendiente. ¿Continuar?"
- "No hay resultados para estos tags"

### Mensajes de Error
- "Error: La fecha no puede ser futura"
- "Error: Debe seleccionar un cliente para venta a credito"
- "Error: El monto debe ser mayor a 0"
- "Error: Ya existe un corte para esta cajera en esta fecha/sesion"

### Textos de Ayuda
- "Tags: Palabras clave separadas por espacios para busquedas futuras"
- "Efectivo esperado = (Ventas + Cobranza) - (Tarjeta + Credito + Transfer + Retiros + Gastos + Prestamos + Cortesias)"
- "Los pagos se aplican al saldo total del cliente, no a facturas especificas"
- "En reportes consolidados se eliminan ventas entre empresas del grupo"

---

## ANEXO E: CONSIDERACIONES DE SEGURIDAD Y BACKUP

### Seguridad de Datos
1. **Autenticacion:**
   - Login con usuario y password
   - Sesion expira tras 2 horas de inactividad
   - Opcion "Recordar sesion" por 7 dias

2. **Permisos:**
   - Contadora: CRUD completo
   - Duenos: Solo lectura
   - No permitir eliminacion de cortes cerrados
   - Log de todas las acciones criticas

3. **Auditoria:**
   - Registro de quien creo/modifico cada transaccion
   - Timestamp de todas las operaciones
   - Historial de cambios en registros importantes

### Backup y Recuperacion
1. **Backup Automatico:**
   - Diario a las 11:00 PM
   - Retener ultimos 30 dias
   - Backup semanal retenido 6 meses

2. **Exportacion Manual:**
   - Opcion para exportar todo a Excel
   - Por empresa o consolidado
   - Por rango de fechas

3. **Recuperacion:**
   - Restaurar desde backup especifico
   - Solo para usuarios admin
   - Confirmar operacion multiple veces

---

## ANEXO F: FUTURAS MEJORAS (POST-MVP)

### Fase 2 - Mejoras Planeadas
1. **Graficos y Analytics:**
   - Tendencia de ventas por mes
   - Comparativo de gastos por categoria
   - Grafico de flujo de caja
   - Analisis de rentabilidad por empresa

2. **Notificaciones:**
   - Email/SMS de vencimientos proximos
   - Alerta de diferencias grandes en cortes
   - Resumen diario automatico para duenos

3. **Integraciones:**
   - Importar desde Excel/CSV
   - Exportar a contabilidad
   - API para otros sistemas
   - Conectar con banco para conciliacion

4. **Mobile App Nativa:**
   - App dedicada para duenos
   - Notificaciones push
   - Consultas offline
   - Firma digital de aprobaciones

### Fase 3 - Funcionalidades Avanzadas
1. **Inventario Basico:**
   - Control de stock de carne
   - Alertas de minimos
   - Relacion compra-venta

2. **Predicciones:**
   - Forecast de ventas
   - Sugerencias de compra
   - Deteccion de patrones

3. **Optimizaciones:**
   - Sugerencias de ahorro
   - Analisis de proveedores
   - Benchmarking entre empresas

---

FIN DE LA ESPECIFICACION