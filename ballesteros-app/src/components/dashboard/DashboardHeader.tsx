'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Building2, LogOut, User } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { toast } from 'sonner'

interface EmpresaData {
  id: number
  nombre: string
  activa: boolean
}

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  backLink?: string
  backLabel?: string
}

export default function DashboardHeader({
  title,
  subtitle,
  showBackButton = false,
  backLink = "/dashboard",
  backLabel = "Volver"
}: DashboardHeaderProps) {
  const { data: session } = useSession()
  const [empresas, setEmpresas] = useState<EmpresaData[]>([])
  const [empresaActiva, setEmpresaActiva] = useState<string>('')
  const [loadingEmpresas, setLoadingEmpresas] = useState(true)

  // Cargar empresas
  const cargarEmpresas = async () => {
    try {
      const response = await fetch('/api/empresas')
      if (response.ok) {
        const data = await response.json()
        setEmpresas(data.empresas.filter((emp: EmpresaData) => emp.activa))
      }
    } catch (error) {
      console.error('Error al cargar empresas:', error)
    } finally {
      setLoadingEmpresas(false)
    }
  }

  // Cargar empresa activa desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmpresa = localStorage.getItem('empresaActiva')
      if (savedEmpresa) {
        setEmpresaActiva(savedEmpresa)
      } else {
        // Si no hay empresa guardada, usar la primera empresa por defecto
        if (empresas.length > 0) {
          const defaultEmpresa = empresas.find(e => e.nombre.toLowerCase().includes('ballesteros')) || empresas[0]
          setEmpresaActiva(defaultEmpresa.id.toString())
          localStorage.setItem('empresaActiva', defaultEmpresa.id.toString())
        }
      }
    }
  }, [empresas])

  useEffect(() => {
    cargarEmpresas()
  }, [])

  const cambiarEmpresa = (empresaId: string) => {
    setEmpresaActiva(empresaId)
    localStorage.setItem('empresaActiva', empresaId)

    const empresa = empresas.find(e => e.id.toString() === empresaId)
    if (empresa) {
      toast.success(`Cambiado a: ${empresa.nombre}`)
    }
  }

  const empresaActivaNombre = empresas.find(e => e.id.toString() === empresaActiva)?.nombre || 'Cargando...'

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

        {/* Título y empresa activa */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
          </div>

          {/* Empresa activa destacada */}
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <Building2 className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-xs text-blue-600 font-medium">EMPRESA ACTIVA</div>
              <div className="text-lg font-bold text-blue-900">{empresaActivaNombre}</div>
            </div>
          </div>
        </div>

        {/* Controles del header */}
        <div className="flex items-center gap-4">

          {/* Selector de empresa */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Cambiar empresa:</label>
            <Select
              value={empresaActiva}
              onValueChange={cambiarEmpresa}
              disabled={loadingEmpresas}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id.toString()}>
                    {empresa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info del usuario y logout */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{session?.user?.name || 'Usuario'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}