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
  tags: z.string().optional(),
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
  // CONVERTIR TODOS LOS CAMPOS A NUMBER PARA EVITAR CONCATENACIÓN DE STRINGS
  const venta_neta = Number(data.venta_neta || 0)
  const venta_efectivo = Number(data.venta_efectivo || 0)
  const venta_credito = Number(data.venta_credito || 0)
  const venta_plataforma = Number(data.venta_plataforma || 0)
  const cobranza = Number(data.cobranza || 0)
  const venta_credito_tarjeta = Number(data.venta_credito_tarjeta || 0)
  const venta_debito_tarjeta = Number(data.venta_debito_tarjeta || 0)
  const venta_transferencia = Number(data.venta_transferencia || 0)
  const retiro_parcial = Number(data.retiro_parcial || 0)
  const gasto = Number(data.gasto || 0)
  const compra = Number(data.compra || 0)
  const prestamo = Number(data.prestamo || 0)
  const cortesia = Number(data.cortesia || 0)
  const otros_retiros = Number(data.otros_retiros || 0)

  const venta_tarjeta = venta_credito_tarjeta + venta_debito_tarjeta

  // VENTAS SIN EFECTIVO (formas de venta que NO generan efectivo físico en caja)
  const total_ingresos = venta_credito + venta_plataforma +
                        venta_tarjeta + venta_transferencia + cortesia

  // EGRESOS REALES (que reducen efectivo físico)
  const total_egresos = gasto + compra + prestamo +
                       retiro_parcial + otros_retiros

  // EFECTIVO ESPERADO = Venta Neta - (Ventas sin efectivo) - (Egresos reales) + Cobranza
  const ventas_sin_efectivo = venta_tarjeta + venta_transferencia +
                             venta_credito + venta_plataforma + cortesia

  const efectivo_esperado = venta_neta - ventas_sin_efectivo - total_egresos + cobranza

  const diferencia = venta_efectivo - efectivo_esperado

  // CÁLCULO INDIRECTO: Venta en Efectivo = Efectivo en Caja + Egresos Reales - Cobranza
  const venta_efectivo_calculada = venta_efectivo + total_egresos - cobranza

  // VENTA TOTAL REGISTRADA = Venta en Efectivo Calculada + Ventas sin Efectivo (SIN cobranza)
  const venta_total_registrada = venta_efectivo_calculada + total_ingresos

  // INGRESO TOTAL REGISTRADO = Venta Total Registrada + Cobranza
  const ingreso_total_registrado = venta_total_registrada + cobranza

  return {
    venta_tarjeta,
    total_ingresos,
    total_egresos,
    efectivo_esperado,
    diferencia,
    venta_efectivo_calculada,
    venta_total_registrada,
    ingreso_total_registrado,
    adeudo_generado: diferencia < -50 // Tolerancia de $50
  }
}