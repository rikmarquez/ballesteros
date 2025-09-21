import { z } from 'zod'

// Esquema para crear nuevo corte de caja
export const crearCorteSchema = z.object({
  empresa_id: z.string().min(1, 'Selecciona una empresa'),
  empleado_id: z.string().min(1, 'Selecciona una cajera'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  sesion: z.number().min(1, 'La sesión debe ser mayor a 0').default(1),
  venta_neta: z.string()
    .min(1, 'La venta neta es requerida')
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= 0, 'La venta neta debe ser un número válido mayor o igual a 0'),
  efectivo_real: z.string()
    .optional()
    .transform((val) => val ? parseFloat(val) : undefined)
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'El efectivo real debe ser un número válido mayor o igual a 0'),
  tags: z.string().optional(),
})

// Esquema para actualizar corte existente
export const actualizarCorteSchema = z.object({
  venta_neta: z.string()
    .optional()
    .transform((val) => val ? parseFloat(val) : undefined)
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'La venta neta debe ser un número válido mayor o igual a 0'),
  efectivo_real: z.string()
    .optional()
    .transform((val) => val ? parseFloat(val) : undefined)
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'El efectivo real debe ser un número válido mayor o igual a 0'),
  tags: z.string().optional(),
  estado: z.enum(['activo', 'cerrado', 'eliminado']).optional(),
})

// Esquema para filtros de búsqueda
export const filtrosCorteSchema = z.object({
  empresa_id: z.string().optional(),
  empleado_id: z.string().optional(),
  fecha: z.string().optional(),
  estado: z.enum(['activo', 'cerrado', 'eliminado']).optional(),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 50),
  offset: z.string().optional().transform((val) => val ? parseInt(val) : 0),
})

// Tipos TypeScript derivados de los esquemas
export type CrearCorteData = z.infer<typeof crearCorteSchema>
export type ActualizarCorteData = z.infer<typeof actualizarCorteSchema>
export type FiltrosCorteData = z.infer<typeof filtrosCorteSchema>

// Esquema para validar datos de movimientos dentro del corte
export const ventaCorteSchema = z.object({
  forma_pago: z.enum(['efectivo', 'tarjeta', 'credito', 'transferencia']),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  cliente_id: z.number().optional(),
  tags: z.string().optional(),
})

export const cortesiaCorteSchema = z.object({
  monto: z.number().positive('El monto debe ser mayor a 0'),
  beneficiario: z.string().min(1, 'El beneficiario es requerido'),
  tags: z.string().optional(),
})

export const ingresoTurnoSchema = z.object({
  tipo: z.enum(['cobranza_efectivo', 'transferencia']),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  cliente_id: z.number().optional(),
  tags: z.string().optional(),
})

export const egresoTurnoSchema = z.object({
  tipo: z.enum(['gasto', 'compra', 'prestamo', 'retiro']),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  relacionado_id: z.number().optional(),
  categoria_id: z.number().optional(),
  subcategoria_id: z.number().optional(),
  tags: z.string().optional(),
  descripcion: z.string().optional(),
})

export type VentaCorteData = z.infer<typeof ventaCorteSchema>
export type CortesiaCorteData = z.infer<typeof cortesiaCorteSchema>
export type IngresoTurnoData = z.infer<typeof ingresoTurnoSchema>
export type EgresoTurnoData = z.infer<typeof egresoTurnoSchema>