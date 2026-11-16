import { Building2, User, Phone, MapPin, Mail, Hash, Cpu, Tag, Layers, Barcode } from 'lucide-react'
import { FieldGroup, FormField, DataTile } from '../components/interventionUi'

function getClientAddress(selectedClient, interventionData) {
  if (!selectedClient) return interventionData.clientAddress
  const trimmed = String(selectedClient.address || '').trim()
  if (trimmed) return trimmed
  const city = selectedClient.city || ''
  const zone = selectedClient.zone ? ', ' + selectedClient.zone : ''
  return city + zone
}

function getMachineModelValue(selectedMachine, interventionData) {
  if (!selectedMachine) return interventionData.machineModel
  const model = String(selectedMachine.model || '').trim()
  return model || selectedMachine.year
}

export function ClientInfoFields({ interventionData, selectedClient, clients, isReadOnly, handleChange }) {
  return (
    <FieldGroup title="Identification client" icon={Building2}>
      {isReadOnly ? (
        <DataTile label="Client" value={interventionData.clientName} icon={Building2} emphasis />
      ) : (
        <FormField label="Client" htmlFor="edit-clientId" icon={Building2} required>
          <select id="edit-clientId" name="clientId" value={interventionData.clientId} onChange={handleChange} className="ui-select w-full pl-10">
            <option value="">Sélectionner un client</option>
            {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </FormField>
      )}
      <DataTile label="Code client" value={selectedClient?.code || interventionData.clientCode} icon={Hash} mono />
      <FormField label="Demandeur" htmlFor="edit-requestorName" icon={User}>
        <input id="edit-requestorName" type="text" name="requestorName" value={interventionData.requestorName || ''} onChange={handleChange} placeholder="Nom du contact" className="ui-input w-full pl-10" />
      </FormField>
      <DataTile label="Téléphone" value={selectedClient?.phone || interventionData.clientPhone} icon={Phone} />
      <DataTile label="E-mail" value={selectedClient?.email || interventionData.clientEmail} icon={Mail} />
      <FormField label="Site / localisation" htmlFor="edit-siteName" icon={MapPin}>
        <input id="edit-siteName" type="text" name="siteName" value={interventionData.siteName || ''} onChange={handleChange} readOnly={isReadOnly} className="ui-input w-full pl-10 read-only:bg-slate-50" />
      </FormField>
      <DataTile label="Adresse" value={getClientAddress(selectedClient, interventionData)} icon={MapPin} full />
    </FieldGroup>
  )
}

export function EquipmentInfoFields({ interventionData, selectedMachine, machines, isReadOnly, handleChange }) {
  return (
    <FieldGroup title="Fiche technique équipement" icon={Cpu}>
      {isReadOnly ? (
        <DataTile label="Équipement" value={interventionData.machineType} icon={Cpu} emphasis />
      ) : (
        <FormField label="Équipement" htmlFor="edit-machineId" icon={Cpu} required>
          <select id="edit-machineId" name="machineId" value={interventionData.machineId} onChange={handleChange} className="ui-select w-full pl-10">
            <option value="">Sélectionner une machine</option>
            {machines.map((m) => (<option key={m.id} value={m.id}>{m.designation}</option>))}
          </select>
        </FormField>
      )}
      <DataTile label="Marque" value={selectedMachine?.brand || interventionData.machineBrand} icon={Tag} />
      <DataTile label="Modèle" value={getMachineModelValue(selectedMachine, interventionData)} icon={Layers} />
      <DataTile label="Numéro de série" value={selectedMachine?.serialNumber || interventionData.serialNumber} icon={Barcode} mono />
    </FieldGroup>
  )
}
