import React from 'react'
import { Activity, Calendar, Cpu, DollarSign, Hash, MapPin, Settings, Tag, User, Wrench } from 'lucide-react'
import EntitySelectionModal from '../common/EntitySelectionModal'

const initialMachineForm = {
  code: '',
  designation: '',
  brand: '',
  serialNumber: '',
  year: '',
  client: '',
  site: '',
  service: '',
  unitAmount: ''
}

function getMachineModalTitle(view, editingMachine) {
  if (view === 'list') return 'Sélectionner une Machine'
  return editingMachine ? 'Modifier la Machine' : 'Ajouter une Nouvelle Machine'
}

function getMachineModalSubtitle(view) {
  return view === 'list' ? 'Gestion du parc machines et fiches techniques' : 'Informations détaillées de l\'équipement'
}

function safeText(value) {
  return String(value || '')
}

const machineColumns = [
  {
    label: 'Code Machine',
    className: 'whitespace-nowrap',
    render: (machine) => <span className="text-[10px] sm:text-xs font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">{machine.code}</span>
  },
  {
    label: 'Désignation',
    render: (machine) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
          <Settings size={16} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{machine.designation}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{machine.brand || machine.year || ''}</p>
        </div>
      </div>
    )
  },
  {
    label: 'Identification',
    render: (machine) => (
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Hash size={12} />{machine.serialNumber || 'Non renseigné'}</p>
        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><MapPin size={12} />{machine.site || 'Non renseigné'}</p>
      </div>
    )
  }
]

const machineFormSections = [
  {
    title: 'Fiche technique',
    subtitle: 'Identification machine',
    icon: Settings,
    fields: [
      { name: 'code', label: 'Code machine', icon: Hash, required: true },
      { name: 'designation', label: 'Désignation', icon: Cpu, required: true },
      { name: 'brand', label: 'Marque', icon: Tag },
      { name: 'serialNumber', label: 'N° de série', icon: Hash },
      { name: 'year', label: 'Année', icon: Calendar },
      { name: 'unitAmount', label: 'Montant unitaire', type: 'number', icon: DollarSign }
    ]
  },
  {
    title: 'Affectation',
    subtitle: 'Client et emplacement',
    icon: Wrench,
    fields: [
      { name: 'client', label: 'Client', icon: User },
      { name: 'site', label: 'Site', icon: MapPin },
      { name: 'service', label: 'Service', icon: Activity, className: 'sm:col-span-2' }
    ]
  }
]

export default function MachineSelectionModal({ isOpen, onClose, onSelect }) {
  return (
    <EntitySelectionModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onSelect}
      entityName="machine"
      fetchEndpoint="/machines"
      getTitle={getMachineModalTitle}
      getSubtitle={getMachineModalSubtitle}
      listIcon={<Settings size={20} className="sm:w-6 sm:h-6" />}
      formIcon={<Cpu size={20} className="sm:w-6 sm:h-6" />}
      primaryColor="green"
      emptyMessage="Aucune machine trouvée"
      columns={machineColumns}
      initialForm={initialMachineForm}
      resetForm={(count) => ({
        ...initialMachineForm,
        code: `MAC-2026-00${count + 1}`,
        year: new Date().getFullYear().toString()
      })}
      filterFn={(machine, query) =>
        safeText(machine.designation).toLowerCase().includes(query) ||
        safeText(machine.code).toLowerCase().includes(query) ||
        safeText(machine.brand).toLowerCase().includes(query) ||
        safeText(machine.serialNumber).toLowerCase().includes(query)
      }
      formSections={machineFormSections}
      actions={{
        addLabel: 'Ajouter Machine',
        saveLabel: 'Enregistrer Machine',
        updateLabel: 'Mettre à jour'
      }}
    />
  )
}
