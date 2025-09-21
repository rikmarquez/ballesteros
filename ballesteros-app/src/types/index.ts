export type Empresa = {
  id: number
  nombre: string
  activa: boolean
  created_at: Date
}

export type Empleado = {
  id: number
  nombre: string
  telefono?: string
  puesto?: string
  puede_operar_caja: boolean
  activo: boolean
  created_at: Date
}

export type Cliente = {
  id: number
  empresa_id: number
  nombre: string
  telefono?: string
  saldo_inicial: number
  created_at: Date
}

export type CorteCaja = {
  id: number
  empresa_id: number
  empleado_id: number
  fecha: Date
  sesion: number
  venta_neta: number
  efectivo_esperado?: number
  efectivo_real?: number
  diferencia?: number
  tags?: string
  adeudo_generado: boolean
  estado: string
  created_at: Date
}

export type VentaCorte = {
  id: number
  corte_id: number
  forma_pago: 'efectivo' | 'tarjeta' | 'credito' | 'transferencia'
  monto: number
  cliente_id?: number
  tags?: string
  created_at: Date
}

export type CortesiaCorte = {
  id: number
  corte_id: number
  monto: number
  beneficiario: string
  tags?: string
}

export type IngresoTurno = {
  id: number
  corte_id: number
  tipo: 'cobranza_efectivo' | 'transferencia'
  monto: number
  cliente_id?: number
  tags?: string
}

export type EgresoTurno = {
  id: number
  corte_id: number
  tipo: 'gasto' | 'compra' | 'prestamo' | 'retiro'
  monto: number
  relacionado_id?: number
  categoria_id?: number
  subcategoria_id?: number
  tags?: string
  descripcion?: string
}

export type CategoriaGasto = {
  id: number
  nombre: string
  tipo?: string
  activa: boolean
}

export type SubcategoriaGasto = {
  id: number
  categoria_id: number
  nombre: string
}