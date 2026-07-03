import React from 'react'

const FIELD_LABEL_STYLE = { fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }
const FIELD_VALUE_STYLE = { fontSize: '9px', fontWeight: '400' }
const TABLE_FONT = { fontFamily: 'Arial, Helvetica, sans-serif' }
const TYPES = ['Devis', 'Livraison', 'Formation', 'Installation', 'Réparation', 'Garantie']

function formatDate(value) {
  return value ? value.split('-').reverse().join('/') : '....../....../2026'
}

function LabelCell({ children, className = '' }) {
  return (
    <td className={`border border-slate-900 bg-slate-50 p-1 ${className}`}>
      <p style={FIELD_LABEL_STYLE}>{children}</p>
    </td>
  )
}

function ValueCell({ children, className = '', colSpan, style }) {
  return (
    <td className={`border border-slate-900 p-1 ${className}`} colSpan={colSpan} style={style}>
      <span style={FIELD_VALUE_STYLE}>{children}</span>
    </td>
  )
}

function SectionRail({ children }) {
  return (
    <div className="w-[18px] bg-slate-50 border-r border-slate-900 flex items-center justify-center relative overflow-hidden shrink-0">
      <p style={{ fontSize: '6px', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.1em', color: '#444', position: 'absolute', writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: 0 }}>{children}</p>
    </div>
  )
}

function Header({ logo }) {
  return (
    <div className="flex justify-between items-center pb-3 mb-3" style={{ borderBottom: '1px solid #000' }}>
      <div className="w-16 h-16 shrink-0">
        <img src={logo} alt="Logo Left" className="w-full h-full object-contain grayscale opacity-80" />
      </div>
      <div className="text-center flex-1 px-2">
        <h2 style={{ fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 3px 0', letterSpacing: '0.02em' }}>Fiche d'intervention de S.A.V</h2>
        <p style={{ fontSize: '10px', fontStyle: 'italic', color: '#555', margin: '0 0 2px 0' }}>Nous vous garantissons la qualité</p>
        <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>SOMACS SERVICE S.A.R.L</p>
      </div>
      <div className="w-16 h-16 shrink-0">
        <img src={logo} alt="Logo Right" className="w-full h-full object-contain grayscale opacity-80" />
      </div>
    </div>
  )
}

function TimingTable({ data }) {
  return (
    <table className="w-full border-collapse border border-slate-900 mb-[6px]" style={TABLE_FONT}>
      <tbody>
        <tr>
          <LabelCell className="w-[22%]">Date de l'intervention</LabelCell>
          <ValueCell className="text-center w-[20%]">{formatDate(data.interventionDate)}</ValueCell>
          <LabelCell className="w-[15%]">Heure d'entrée</LabelCell>
          <ValueCell className="text-center w-[13%]">{data.startTime || '........h..........'}</ValueCell>
          <td className="border border-slate-900 bg-slate-50 p-1 text-center" rowSpan="3" style={{ width: '18%', verticalAlign: 'top' }}>
            <p style={FIELD_LABEL_STYLE}>Prise en charge par</p>
            <p style={{ ...FIELD_VALUE_STYLE, marginTop: '6px' }}>{data.technicianName || ''}</p>
          </td>
        </tr>
        <tr>
          <LabelCell>Numéro de la fiche</LabelCell>
          <ValueCell className="text-center">{data.ficheNumber}</ValueCell>
          <LabelCell>Heure de sortie</LabelCell>
          <ValueCell className="text-center">{data.endTime || '........h..........'}</ValueCell>
        </tr>
        <tr>
          <LabelCell>Site</LabelCell>
          <ValueCell className="text-center">{data.siteName || '..............................'}</ValueCell>
          <LabelCell>TOTAL</LabelCell>
          <ValueCell className="text-center">{data.totalTime || '..............................'}</ValueCell>
        </tr>
      </tbody>
    </table>
  )
}

function InterventionTypeTable({ selectedType }) {
  return (
    <table className="w-full border-collapse border border-slate-900 mb-[6px]" style={TABLE_FONT}>
      <thead>
        <tr>
          <th className="border border-slate-900 bg-slate-50 p-1 w-[22%]" rowSpan="2">
            <p style={{ ...FIELD_LABEL_STYLE, textAlign: 'center' }}>Type<br />d'intervention</p>
          </th>
          {TYPES.map((type) => (
            <th key={type} className="border border-slate-900 bg-slate-50 p-1 text-center">
              <p style={FIELD_LABEL_STYLE}>{type}</p>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-slate-900 bg-slate-50 p-1"></td>
          {TYPES.map((type) => (
            <td key={type} className="border border-slate-900 p-1 text-center" style={{ height: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700' }}>{selectedType === type ? 'X' : ''}</span>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}

function ReservedTable({ data }) {
  const rows = [
    ['Client', data.clientName || '', 'Code client', data.clientCode || ''],
    ['Adresse', data.clientAddress || '', null, null],
    ['Demandeur', data.requestorName || '', 'Téléphone', data.clientPhone || ''],
    ['E-mail', data.clientEmail || '', null, null],
    ['Equipement', data.machineType || '', null, null],
    ['Marque', data.machineBrand || '', null, null],
    ['Modèle', data.machineModel || '', null, null],
  ]

  return (
    <div className="flex border border-slate-900 mb-[6px]" style={TABLE_FONT}>
      <SectionRail>Réservé À SOMACS SERVICE</SectionRail>
      <table className="flex-1 border-collapse">
        <tbody>
          {rows.map(([label, value, secondLabel, secondValue]) => (
            <tr key={label}>
              <td className="border-b border-r border-slate-900 bg-slate-50 p-1 w-[18%]"><p style={FIELD_LABEL_STYLE}>{label}</p></td>
              <td className={`border-b border-slate-900 p-1 ${secondLabel ? 'border-r w-[42%]' : ''}`} colSpan={secondLabel ? undefined : 3}><span style={FIELD_VALUE_STYLE}>{value}</span></td>
              {secondLabel && (
                <>
                  <td className="border-b border-r border-slate-900 bg-slate-50 p-1 w-[16%]"><p style={FIELD_LABEL_STYLE}>{secondLabel}</p></td>
                  <td className="border-b border-slate-900 p-1 w-[24%]"><span style={FIELD_VALUE_STYLE}>{secondValue}</span></td>
                </>
              )}
            </tr>
          ))}
          <tr>
            <td className="border-b border-r border-slate-900 bg-slate-50 p-1"><p style={FIELD_LABEL_STYLE}>Numéro de série</p></td>
            <td className="border-b border-slate-900 p-1" colSpan="3"><span style={{ ...FIELD_VALUE_STYLE, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{data.serialNumber || ''}</span></td>
          </tr>
          <tr>
            <td className="border-r border-slate-900 bg-slate-50 p-1"><p style={FIELD_LABEL_STYLE}>Type de panne</p></td>
            <td className="p-1" colSpan="3"><span style={FIELD_VALUE_STYLE}>{data.problemDescription ? data.problemDescription.substring(0, 80) : ''}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function DetailSection({ data }) {
  return (
    <div className="border border-slate-900 mb-[6px]" style={TABLE_FONT}>
      <div className="bg-slate-50 border-b border-slate-900 p-1 text-center">
        <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>Détail de l'intervention</p>
      </div>
      <div className="border-b border-slate-900 p-1 bg-white">
        <p style={{ ...FIELD_LABEL_STYLE, textDecoration: 'underline' }}>
          Diagnostic téléphonique : <span style={{ fontWeight: '400', textTransform: 'none', textDecoration: 'none', marginLeft: '5px' }}>{data.telephoneDiagnostic || ''}</span>
        </p>
      </div>
      <div className="relative h-[125px]" style={{ background: 'repeating-linear-gradient(to bottom, white 0px, white 13px, #cbd5e1 13px, #cbd5e1 13.5px)' }}>
        <div className="p-1.5">
          <p style={{ fontSize: '8px', fontStyle: 'italic', color: '#1e40af', lineHeight: '13.5px', margin: 0 }}>
            <span style={{ fontWeight: '700', textTransform: 'uppercase', textDecoration: 'underline', fontStyle: 'normal', color: '#000', marginRight: '5px' }}>Solution d'intervention :</span>
            {data.interventionDetail || ''}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex">
          <div className="flex border-t border-r border-slate-900">
            <div className="bg-slate-50 border-r border-slate-900 px-1.5 py-0.5 flex items-center">
              <p style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Nombre d'essai</p>
            </div>
            <div className="px-3 py-0.5 flex items-center justify-center min-w-[30px]">
              <span style={FIELD_VALUE_STYLE}>{data.numEssai || ''}</span>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="flex border-t border-l border-slate-900">
            <div className="bg-slate-50 border-r border-slate-900 px-1.5 py-0.5 flex items-center">
              <p style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Essai concluant</p>
            </div>
            <div className={`border-r border-slate-900 px-2 py-0.5 flex items-center justify-center ${data.essaiConcluant === true ? 'bg-green-100' : ''}`}>
              <span style={{ fontSize: '8px', fontWeight: '700' }}>Oui</span>
            </div>
            <div className={`px-2 py-0.5 flex items-center justify-center ${data.essaiConcluant === false ? 'bg-red-100' : ''}`}>
              <span style={{ fontSize: '8px', fontWeight: '700' }}>Non</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PartsTable({ parts }) {
  return (
    <div className="flex border border-slate-900 mb-[6px]" style={TABLE_FONT}>
      <SectionRail>Les articles utilisés</SectionRail>
      <table className="flex-1 border-collapse">
        <thead>
          <tr>
            <th className="border-b border-r border-slate-900 bg-slate-50 p-1 text-center w-[30%]"><p style={FIELD_LABEL_STYLE}>Référence</p></th>
            <th className="border-b border-r border-slate-900 bg-slate-50 p-1 text-center"><p style={FIELD_LABEL_STYLE}>Désignation</p></th>
            <th className="border-b border-slate-900 bg-slate-50 p-1 text-center w-[18%]"><p style={FIELD_LABEL_STYLE}>Quantité</p></th>
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4, 5].map((row) => {
            const part = parts[row]
            return (
              <tr key={row}>
                <td className={`${row < 5 ? 'border-b' : ''} border-r border-slate-900 p-1 h-[14px]`}>{part && <span style={{ fontSize: '8px', fontWeight: '400' }}>{part.reference}</span>}</td>
                <td className={`${row < 5 ? 'border-b' : ''} border-r border-slate-900 p-1 h-[14px]`}>{part && <span style={{ fontSize: '8px', fontWeight: '400' }}>{part.designation}</span>}</td>
                <td className={`${row < 5 ? 'border-b' : ''} border-slate-900 p-1 h-[14px] text-center`}>{part && <span style={{ fontSize: '8px', fontWeight: '400' }}>{part.quantity}</span>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LaborPrice({ value }) {
  return (
    <div className="flex justify-center mb-[8px]" style={TABLE_FONT}>
      <div className="border border-slate-900 flex">
        <div className="bg-slate-50 px-4 py-1.5 border-r border-slate-900 flex items-center">
          <p style={FIELD_LABEL_STYLE}>Prix M.O (HT) :</p>
        </div>
        <div className="px-8 py-1.5 flex items-center justify-center min-w-[80px]">
          <span style={FIELD_VALUE_STYLE}>{value || ''}</span>
        </div>
      </div>
    </div>
  )
}

function Signatures({ data, technicianSignatureUrl, clientSignatureUrl }) {
  return (
    <div className="flex gap-0 mb-[6px]" style={TABLE_FONT}>
      <div className="flex-1 border border-slate-900">
        <div className="bg-slate-50 border-b border-slate-900 p-1 text-center">
          <p style={FIELD_LABEL_STYLE}>Signature du technicien</p>
        </div>
        <div className="h-[50px] flex items-center justify-center p-1">
          {technicianSignatureUrl ? (
            <img src={technicianSignatureUrl} alt="Signature du technicien" className="max-h-full max-w-full object-contain" style={{ mixBlendMode: 'multiply' }} />
          ) : (
            <p style={{ fontSize: '7px', color: '#e2e8f0', fontStyle: 'italic' }}>{data.technicianName || ''}</p>
          )}
        </div>
      </div>
      <div className="w-[30px]"></div>
      <div className="flex-1 border border-slate-900">
        <div className="bg-slate-50 border-b border-slate-900 p-1 text-center">
          <p style={FIELD_LABEL_STYLE}>Signature et cachet client</p>
        </div>
        <div className="h-[50px] flex items-center justify-center p-1">
          {clientSignatureUrl && <img src={clientSignatureUrl} alt="Signature et cachet client" className="max-h-full max-w-full object-contain" style={{ mixBlendMode: 'multiply' }} />}
        </div>
      </div>
    </div>
  )
}

export default function FicheContent({ interventionData, parts, laborPrice, logo, technicianSignatureUrl, clientSignatureUrl }) {
  const data = interventionData || {}
  const ficheParts = Array.isArray(parts) ? parts : []

  return (
    <>
      <Header logo={logo} />
      <TimingTable data={data} />
      <InterventionTypeTable selectedType={data.interventionType} />
      <ReservedTable data={data} />
      <DetailSection data={data} />
      <PartsTable parts={ficheParts} />
      <LaborPrice value={laborPrice} />
      <Signatures data={data} technicianSignatureUrl={technicianSignatureUrl} clientSignatureUrl={clientSignatureUrl} />
      <div className="absolute bottom-3 left-7 right-7 border-t border-slate-300 pt-1.5 flex justify-between items-center" style={TABLE_FONT}>
        <p style={{ fontSize: '7px', fontWeight: '600', color: '#64748b', margin: 0 }}>Adresse : 2/2 Rue El Fouledh , Z.I  Mégrine Riadh | Tel : 71296493</p>
        <p style={{ fontSize: '7px', fontWeight: '700', color: '#64748b', margin: 0 }}>MF : 1420197A/A/M/000</p>
      </div>
    </>
  )
}
