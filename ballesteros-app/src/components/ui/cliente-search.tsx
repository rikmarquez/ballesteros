'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Users, CheckCircle } from 'lucide-react'

interface ClienteData {
  id: number
  nombre: string
  saldo_pendiente?: number
}

interface ClienteSearchProps {
  clientes: ClienteData[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export default function ClienteSearch({
  clientes,
  value,
  onValueChange,
  placeholder = "Buscar cliente...",
  required = false
}: ClienteSearchProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteData | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Encontrar cliente seleccionado cuando cambie el value
  useEffect(() => {
    if (value) {
      const cliente = clientes.find(c => c.id.toString() === value)
      setSelectedCliente(cliente || null)
      if (cliente) {
        setSearch(cliente.nombre)
      }
    } else {
      setSelectedCliente(null)
      setSearch('')
    }
  }, [value, clientes])

  // Filtrar clientes basado en búsqueda
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(search.toLowerCase())
  )

  // Manejar selección de cliente
  const handleSelectCliente = (cliente: ClienteData) => {
    setSelectedCliente(cliente)
    setSearch(cliente.nombre)
    onValueChange(cliente.id.toString())
    setIsOpen(false)
  }

  // Manejar cambio en input de búsqueda
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    setIsOpen(true)

    // Si se borra la búsqueda, limpiar selección
    if (!newSearch) {
      setSelectedCliente(null)
      onValueChange('')
    }
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="pl-10 pr-10"
        />
        {selectedCliente && (
          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
        )}
      </div>

      {/* Dropdown con resultados */}
      {isOpen && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto border shadow-lg">
          {clientesFiltrados.length > 0 ? (
            <div className="p-1">
              {clientesFiltrados.map(cliente => (
                <div
                  key={cliente.id}
                  className={`
                    flex justify-between items-center p-3 rounded cursor-pointer transition-colors
                    ${selectedCliente?.id === cliente.id
                      ? 'bg-green-100 border border-green-200'
                      : 'hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleSelectCliente(cliente)}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{cliente.nombre}</span>
                    {selectedCliente?.id === cliente.id && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  {cliente.saldo_pendiente && cliente.saldo_pendiente > 0 && (
                    <span className="text-sm text-red-600 font-medium">
                      Debe: ${Number(cliente.saldo_pendiente).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No se encontraron clientes</p>
              {search && (
                <p className="text-sm">que coincidan con "{search}"</p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Información del cliente seleccionado */}
      {selectedCliente && selectedCliente.saldo_pendiente && selectedCliente.saldo_pendiente > 0 && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
          <div className="flex items-center gap-2 text-red-700">
            <Users className="h-4 w-4" />
            <span className="font-medium">
              {selectedCliente.nombre} debe: ${Number(selectedCliente.saldo_pendiente).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}