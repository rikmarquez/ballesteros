import { z } from 'zod'

// Esquema para crear nuevo corte de caja (NUEVO FLUJO SIMPLIFICADO)
export const crearCorteSchema = z.object({
  empresa_id: z.string().min(1, 'Selecciona una empresa'),
  entidad_id: z.string().min(1, 'Selecciona una cajera'), // Cambiado de empleado_id a entidad_id
  fecha: z.string().min(1, 'La fecha es requerida'),
  sesion: z.number().min(1, 'La sesión debe ser mayor a 0').default(1),

  // CAPTURA MANUAL (desde POS)
  venta_neta: z.number().min(0, 'La venta neta debe ser mayor o igual a 0'),

  // EFECTIVO REPORTADO POR CAJERA (captura manual)
  venta_efectivo: z.number().min(0, 'Debe ser mayor o igual a 0').default(0), // Efectivo físico en caja
  venta_credito: z.number().min(0, 'Debe ser mayor o igual a 0').default(0),
  venta_plataforma: z.number().min(0, 'Debe ser mayor o igual a 0').default(0),
  cobranza: z.number().min(0, 'Debe ser mayor o igual a 0').default(0),

  // EGRESOS (captura manual)
  venta_credito_tarjeta: z.number().min(0, 'Debe ser mayor o igual a 0').default(0),
  venta_debito_tarjeta: z.number().min(0, 'Debe ser mayor o igual a 0').default(0),
  venta_transferencia: z.number().min(0, 'Debe ser mayor o igual a 0').default(0),
  retiro_parcial: z.number().min(0, 'Debe ser mayor o igual a 0').default(0),
  gasto: z.number().min(0, 'Debe ser mayor o igual a 0').default(0),
  compra: z.number().min(0, 'Debe ser mayor o igual a 0').default(0),
  prestamo: z.number().min(0, 'Debe ser mayor o igual a 0').default(0),
  cortesia: z.number().min(0, 'Debe ser mayor o igual a 0').default(0),
  otros_retiros: z.number().min(0, 'Debe ser mayor o igual a 0').default(0),
})

// Esquema para actualizar corte existente
export const actualizarCorteSchema = z.object({
  // CAPTURA MANUAL (desde POS)
  venta_neta: z.number().min(0, 'La venta neta debe ser mayor o igual a 0').optional(),

  // EFECTIVO REPORTADO POR CAJERA (captura manual)
  venta_efectivo: z.number().min(0, 'Debe ser mayor o igual a 0').optional(), // Efectivo físico en caja
  venta_credito: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  venta_plataforma: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  cobranza: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),

  // EGRESOS (captura manual)
  venta_credito_tarjeta: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  venta_debito_tarjeta: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  venta_transferencia: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  retiro_parcial: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  gasto: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  compra: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  prestamo: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  cortesia: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  otros_retiros: z.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  estado: z.enum(['activo', 'cerrado', 'eliminado']).optional(),
})

// Esquema para filtros de búsqueda
export const filtrosCorteSchema = z.object({
  empresa_id: z.string().optional(),
  entidad_id: z.string().optional(), // Cambiado de empleado_id a entidad_id
  fecha: z.string().optional(),
  estado: z.enum(['activo', 'cerrado', 'eliminado', 'all']).optional(),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 50),
  offset: z.string().optional().transform((val) => val ? parseInt(val) : 0),
})

// Tipos TypeScript derivados de los esquemas
export type CrearCorteData = z.infer<typeof crearCorteSchema>
export type ActualizarCorteData = z.infer<typeof actualizarCorteSchema>
export type FiltrosCorteData = z.infer<typeof filtrosCorteSchema>

// Helper para calcular campos automáticamente
export const calcularCamposCorte = (data: CrearCorteData) => {
  const venta_tarjeta = data.venta_credito_tarjeta + data.venta_debito_tarjeta

  // INGRESOS TOTALES (todas las formas de venta + cobranza, SIN incluir efectivo reportado)
  const total_ingresos = data.venta_credito + data.venta_plataforma +
                        venta_tarjeta + data.venta_transferencia + data.cobranza + data.cortesia

  // EGRESOS REALES (que reducen efectivo físico)
  const total_egresos = data.gasto + data.compra + data.prestamo +
                       data.retiro_parcial + data.otros_retiros

  // EFECTIVO ESPERADO = Venta Neta - (Ventas sin efectivo) - (Egresos reales) + Cobranza
  const ventas_sin_efectivo = venta_tarjeta + data.venta_transferencia +
                             data.venta_credito + data.venta_plataforma + data.cortesia

  const efectivo_esperado = data.venta_neta - ventas_sin_efectivo - total_egresos + data.cobranza

  const diferencia = data.venta_efectivo - efectivo_esperado

  // CÁLCULO INDIRECTO: Venta en Efectivo = Efectivo en Caja + Egresos Reales - Cobranza
  const venta_efectivo_calculada = data.venta_efectivo + total_egresos - data.cobranza

  // INGRESO TOTAL REGISTRADO = Venta en Efectivo Calculada + Ventas sin Efectivo + Cobranza
  const ingreso_total_registrado = venta_efectivo_calculada + total_ingresos

  return {
    venta_tarjeta,
    total_ingresos,
    total_egresos,
    efectivo_esperado,
    diferencia,
    venta_efectivo_calculada,
    ingreso_total_registrado,
    adeudo_generado: diferencia < -50 // Tolerancia de $50
  }
}