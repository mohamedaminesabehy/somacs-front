import React, { useState, useEffect } from 'react'
import { AlertCircle, Truck } from 'lucide-react'
import { apiFetch } from '../api/apiClient'

/**
 * VehicleSelector - Component réutilisable pour sélectionner un véhicule
 * Affiche uniquement les véhicules disponibles
 */
export default function VehicleSelector({ value, onChange, disabled = false, required = false }) {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        setLoading(true)
        const response = await apiFetch('/vehicles/available', { auth: true })
        if (!response.ok) throw new Error('Erreur lors du chargement')
        const data = await response.json()
        setVehicles(data || [])
        setError(null)
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailable()
  }, [])

  if (error) {
    return (
      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 uppercase">
        Véhicule affecté {required && <span className="text-red-600">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        disabled={disabled || loading}
        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50"
      >
        <option value="">
          {loading ? 'Chargement...' : '-- Aucun véhicule --'}
        </option>
        {vehicles.map((vehicle) => (
          <option key={vehicle.id} value={vehicle.id}>
            {vehicle.matricule} - {vehicle.marque} {vehicle.modele}
          </option>
        ))}
      </select>
      {vehicles.length === 0 && !loading && (
        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
          <AlertCircle size={14} />
          Aucun véhicule disponible
        </p>
      )}
    </div>
  )
}
