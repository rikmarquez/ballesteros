import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/cortes/[id] - Obtener corte por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const corteId = parseInt(params.id)
    if (isNaN(corteId)) {
      return NextResponse.json(
        { error: "ID de corte inválido" },
        { status: 400 }
      )
    }

    const corte = await prisma.corteCaja.findUnique({
      where: { id: corteId },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
            activa: true
          }
        },
        empleado: {
          select: {
            id: true,
            nombre: true,
            puesto: true
          }
        },
        ventas: {
          include: {
            cliente: {
              select: { id: true, nombre: true }
            }
          }
        },
        cortesias: true,
        ingresos_turno: {
          include: {
            cliente: {
              select: { id: true, nombre: true }
            }
          }
        },
        egresos_turno: {
          include: {
            categoria: { select: { id: true, nombre: true } },
            subcategoria: { select: { id: true, nombre: true } }
          }
        }
      }
    })

    if (!corte) {
      return NextResponse.json(
        { error: "Corte no encontrado" },
        { status: 404 }
      )
    }

    // Convertir a formato de movimientos para la interfaz
    const movimientos = [
      // Ventas en efectivo
      ...corte.ventas
        .filter(v => v.forma_pago === "efectivo")
        .map(v => ({
          id: `venta_efectivo_${v.id}`,
          tipo: "venta_efectivo" as const,
          monto: Number(v.monto),
          descripcion: v.tags || "Venta en efectivo",
          cliente_id: v.cliente_id
        })),

      // Ventas con tarjeta
      ...corte.ventas
        .filter(v => v.forma_pago === "tarjeta")
        .map(v => ({
          id: `venta_tarjeta_${v.id}`,
          tipo: "venta_tarjeta" as const,
          monto: Number(v.monto),
          descripcion: v.tags || "Venta con tarjeta",
          cliente_id: v.cliente_id
        })),

      // Ventas con transferencia
      ...corte.ventas
        .filter(v => v.forma_pago === "transferencia")
        .map(v => ({
          id: `venta_transferencia_${v.id}`,
          tipo: "venta_transferencia" as const,
          monto: Number(v.monto),
          descripcion: v.tags || "Venta por transferencia",
          cliente_id: v.cliente_id
        })),

      // Cobranzas
      ...corte.ingresos_turno
        .filter(i => i.tipo === "cobranza")
        .map(i => ({
          id: `cobranza_${i.id}`,
          tipo: "cobranza" as const,
          monto: Number(i.monto),
          descripcion: i.tags || "Cobranza",
          cliente_id: i.cliente_id
        })),

      // Egresos
      ...corte.egresos_turno.map(e => ({
        id: `egreso_${e.id}`,
        tipo: e.tipo as any,
        monto: Number(e.monto),
        descripcion: e.descripcion || e.tags || "",
        categoria_id: e.categoria_id,
        subcategoria_id: e.subcategoria_id,
        relacionado_id: e.relacionado_id
      })),

      // Cortesías
      ...corte.cortesias.map(c => ({
        id: `cortesia_${c.id}`,
        tipo: "cortesia" as const,
        monto: Number(c.monto),
        descripcion: c.tags || "Cortesía",
        beneficiario: c.beneficiario
      }))
    ]

    return NextResponse.json({
      corte: {
        ...corte,
        venta_neta: Number(corte.venta_neta),
        efectivo_esperado: Number(corte.efectivo_esperado),
        efectivo_real: Number(corte.efectivo_real),
        diferencia: Number(corte.diferencia),
        movimientos
      }
    })

  } catch (error) {
    console.error("Error al obtener corte:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
