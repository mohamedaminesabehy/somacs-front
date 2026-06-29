import React from 'react'
import { Building2, FileText, Globe, Hash, Mail, MapPin, Phone, User, Users } from 'lucide-react'
import EntitySelectionModal from '../common/EntitySelectionModal'

const initialClientForm = {
  code: '',
  name: '',
  type: 'Homme',
  zone: '',
  priceCategory: 'A',
  phone: '',
  phone2: '',
  phone3: '',
  email: '',
  fax: '',
  taxId: '',
  web: '',
  city: ''
}

function getClientModalTitle(view, editingClient) {
  if (view === 'list') return 'SÃ©lectionner un Client'
  return editingClient ? 'Modifier le Client' : 'Ajouter un Nouveau Client'
}

function getClientModalSubtitle(view) {
  return view === 'list' ? 'Gestion de la base de donnÃ©es clients' : 'Informations dÃ©taillÃ©es du client'
}

function safeText(value) {
  return String(value || '')
}

const clientColumns = [
  {
    label: 'Code Client',
    className: 'whitespace-nowrap',
    render: (client) => <span className="text-[10px] sm:text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{client.code}</span>
  },
  {
    label: 'Nom',
    render: (client) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
          <Building2 size={16} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{client.name}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{client.type || client.city || ''}</p>
        </div>
      </div>
    )
  },
  {
    label: 'Contact',
    render: (client) => (
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Phone size={12} />{client.phone || 'Non renseignÃ©'}</p>
        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Mail size={12} />{client.email || 'Non renseignÃ©'}</p>
      </div>
    )
  }
]

const clientFormSections = [
  {
    title: 'IdentitÃ© client',
    subtitle: 'Informations principales',
    icon: User,
    fields: [
      { name: 'code', label: 'Code client', icon: Hash, required: true },
      { name: 'name', label: 'Nom', icon: Building2, required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['Homme', 'Femme', 'SociÃ©tÃ©'] },
      { name: 'priceCategory', label: 'CatÃ©gorie prix', type: 'select', options: ['A', 'B', 'C'] },
      { name: 'taxId', label: 'Matricule fiscal', icon: FileText },
      { name: 'city', label: 'Ville', icon: MapPin }
    ]
  },
  {
    title: 'CoordonnÃ©es',
    subtitle: 'Contact et localisation',
    icon: Phone,
    fields: [
      { name: 'phone', label: 'TÃ©lÃ©phone', icon: Phone },
      { name: 'phone2', label: 'TÃ©lÃ©phone 2', icon: Phone },
      { name: 'phone3', label: 'TÃ©lÃ©phone 3', icon: Phone },
      { name: 'fax', label: 'Fax', icon: Phone },
      { name: 'email', label: 'E-mail', type: 'email', icon: Mail },
      { name: 'web', label: 'Site web', icon: Globe },
      { name: 'zone', label: 'Zone', icon: MapPin, className: 'sm:col-span-2' }
    ]
  }
]

export default function ClientSelectionModal({ isOpen, onClose, onSelect }) {
  return (
    <EntitySelectionModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onSelect}
      entityName="client"
      fetchEndpoint="/clients"
      getTitle={getClientModalTitle}
      getSubtitle={getClientModalSubtitle}
      listIcon={<Users size={20} className="sm:w-6 sm:h-6" />}
      formIcon={<User size={20} className="sm:w-6 sm:h-6" />}
      primaryColor="blue"
      emptyMessage="Aucun client trouvÃ©"
      columns={clientColumns}
      initialForm={initialClientForm}
      resetForm={(count) => ({ ...initialClientForm, code: `CLT-2026-00${count + 1}` })}
      filterFn={(client, query) =>
        safeText(client.name).toLowerCase().includes(query) ||
        safeText(client.code).toLowerCase().includes(query) ||
        safeText(client.email).toLowerCase().includes(query)
      }
      formSections={clientFormSections}
      maxWidthClass="max-w-5xl"
      actions={{
        addLabel: 'Ajouter Client',
        saveLabel: 'Enregistrer Client',
        updateLabel: 'Mettre Ã  jour'
      }}
    />
  )
}
