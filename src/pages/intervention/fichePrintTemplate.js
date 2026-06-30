// ── Fiche d'intervention print/PDF HTML builder ──
// Pure function: builds the A4 print HTML for an intervention sheet.

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export { escapeHtml }

export function buildFichePrintHtml({ interventionData, parts, laborPrice, logo }) {
  const TYPES = ['Devis', 'Livraison', 'Formation', 'Installation', 'Réparation', 'Garantie']
  const currentType = interventionData.interventionType || ''
  const essaiOui = interventionData.essaiConcluant === true
  const essaiNon = interventionData.essaiConcluant === false
  const partRows6 = [0, 1, 2, 3, 4, 5].map((i) => parts[i] || null)
  const dateDisplay = interventionData.interventionDate
    ? interventionData.interventionDate.split('-').reverse().join('/')
    : '.…/.…./2026'

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Fiche d'intervention de S.A.V</title>
<style>
  @page { size: A4 portrait; margin: 10mm 10mm 12mm 10mm; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; color: #000; background: #fff; }

  /* ── HEADER ── */
  .hdr { display: flex; align-items: center; padding-bottom: 5pt; margin-bottom: 4pt; border-bottom: 1.5pt solid #000; }
  .hdr-logo { width: 48pt; height: 48pt; object-fit: contain; flex-shrink: 0; }
  .hdr-mid { flex: 1; text-align: center; padding: 0 6pt; }
  .hdr-mid .title { font-size: 14pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.1; }
  .hdr-mid .sub   { font-size: 8pt; font-style: italic; color: #555; margin-top: 2pt; }
  .hdr-mid .brand { font-size: 9.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2pt; }

  /* ── TABLES ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 3pt; }
  td, th { border: 0.75pt solid #000; padding: 2pt 3pt; vertical-align: middle; font-size: 8pt; }
  .bg { background: #efefef; }
  .bold { font-weight: 700; }
  .upper { text-transform: uppercase; }
  .center { text-align: center; }
  .small { font-size: 7pt; }

  /* ── TABLE 1 : date/heure ── */
  .t1 td { height: 16pt; }
  .t1 .c-lbl  { width: 21%; }
  .t1 .c-val  { width: 17%; }
  .t1 .c-lbl2 { width: 13%; }
  .t1 .c-val2 { width: 11%; }
  .t1 .c-pec  { width: 19%; vertical-align: top; padding-top: 3pt; }

  /* ── TABLE 2 : type d'intervention ── */
  .t2 th, .t2 td { height: 15pt; text-align: center; }
  .t2 .t2-lbl { width: 21%; text-align: center; }
  .t2 .chk { font-size: 11pt; font-weight: 900; }

  /* ── BLOC RÉSERVÉ ── */
  .bloc-res { display: flex; border: 0.75pt solid #000; margin-bottom: 3pt; }
  .res-bar  { width: 14pt; background: #efefef; border-right: 0.75pt solid #000; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
  .res-bar span { font-size: 5.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; writing-mode: vertical-rl; transform: rotate(180deg); color: #222; }
  .res-tbl { flex: 1; border-collapse: collapse; }
  .res-tbl td { border: 0.75pt solid #000; border-left: none; padding: 2pt 3pt; font-size: 8pt; height: 15pt; vertical-align: middle; }
  .res-tbl tr:last-child td { border-bottom: none; }
  .res-tbl .rl  { width: 19%; }
  .res-tbl .rv  { width: 40%; }
  .res-tbl .rl2 { width: 15%; }
  .res-tbl .rv2 { }

  /* ── DÉTAIL ── */
  .bloc-det { border: 0.75pt solid #000; margin-bottom: 3pt; }
  .det-title { background: #efefef; border-bottom: 0.75pt solid #000; padding: 2pt 4pt; text-align: center; font-weight: 700; text-transform: uppercase; font-size: 8pt; letter-spacing: 0.04em; }
  .det-diag  { border-bottom: 0.75pt solid #000; padding: 2.5pt 4pt; font-size: 8pt; min-height: 28pt; }
  .det-body  { padding: 3pt 4pt; min-height: 88pt; font-size: 8pt;
               background: repeating-linear-gradient(to bottom, #fff 0pt, #fff 13pt, #bbb 13pt, #bbb 13.5pt); }
  .det-essai { display: flex; border-top: 0.75pt solid #000; }
  .de-lbl    { background: #efefef; border-right: 0.75pt solid #000; padding: 2pt 5pt; font-weight: 700; text-transform: uppercase; font-size: 7.5pt; display: flex; align-items: center; white-space: nowrap; }
  .de-val    { padding: 2pt 8pt; font-size: 8pt; display: flex; align-items: center; min-width: 28pt; }
  .de-space  { flex: 1; }
  .de-conc   { display: flex; border-left: 0.75pt solid #000; }
  .de-oui    { border-right: 0.75pt solid #000; padding: 2pt 7pt; font-size: 7.5pt; font-weight: 700; display: flex; align-items: center; }
  .de-non    { padding: 2pt 7pt; font-size: 7.5pt; font-weight: 700; display: flex; align-items: center; }

  /* ── ARTICLES ── */
  .bloc-art { display: flex; border: 0.75pt solid #000; margin-bottom: 3pt; }
  .art-bar  { width: 14pt; background: #efefef; border-right: 0.75pt solid #000; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
  .art-bar span { font-size: 5.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; writing-mode: vertical-rl; transform: rotate(180deg); color: #222; }
  .art-tbl { flex: 1; border-collapse: collapse; }
  .art-tbl th { border: 0.75pt solid #000; border-left: none; padding: 2pt 3pt; background: #efefef; font-weight: 700; text-transform: uppercase; text-align: center; font-size: 8pt; }
  .art-tbl td { border: 0.75pt solid #000; border-left: none; padding: 2pt 3pt; font-size: 7.5pt; height: 14pt; }
  .art-tbl tr:last-child td { border-bottom: none; }
  .art-ref { width: 27%; }
  .art-des { }
  .art-qty { width: 14%; text-align: center; }

  /* ── PRIX ── */
  .prix-row { display: flex; justify-content: flex-end; margin-bottom: 4pt; padding-right: 0; }
  .prix-box { display: inline-flex; border: 0.75pt solid #000; }
  .prix-lbl { background: #efefef; border-right: 0.75pt solid #000; padding: 3pt 8pt; font-weight: 700; text-transform: uppercase; font-size: 8pt; display: flex; align-items: center; white-space: nowrap; }
  .prix-val { padding: 3pt 16pt; font-size: 8pt; min-width: 70pt; display: flex; align-items: center; }

  /* ── SIGNATURES ── */
  .sig-row { display: flex; gap: 16pt; margin-bottom: 5pt; }
  .sig-box { flex: 1; border: 0.75pt solid #000; }
  .sig-ttl { background: #efefef; border-bottom: 0.75pt solid #000; padding: 2pt 4pt; text-align: center; font-weight: 700; text-transform: uppercase; font-size: 8pt; }
  .sig-area { height: 44pt; }

  /* ── FOOTER ── */
  .ftr { border-top: 0.75pt solid #999; padding-top: 3pt; margin-top: 4pt; display: flex; justify-content: space-between; align-items: center; font-size: 7pt; color: #444; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="hdr">
  <img class="hdr-logo" src="${logo}" alt="Logo SOMACS"/>
  <div class="hdr-mid">
    <div class="title">Fiche d'intervention de S.A.V</div>
    <div class="sub">Nous vous garantissons la qualité</div>
    <div class="brand">SOMACS SERVICE S.A.R.L</div>
  </div>
  <img class="hdr-logo" src="${logo}" alt="Logo SOMACS"/>
</div>

<!-- TABLE 1 : Date / Heure / Prise en charge -->
<table class="t1">
  <tr>
    <td class="bg bold upper small c-lbl">Date de l'intervention</td>
    <td class="center c-val">${escapeHtml(dateDisplay)}</td>
    <td class="bg bold upper small c-lbl2">Heure d'entrée</td>
    <td class="center c-val2">${escapeHtml(interventionData.startTime || '………..…h………………')}</td>
    <td class="bg bold upper small center c-pec" rowspan="3">
      Prise en charge par<br/><br/>
      <span style="font-weight:400">${escapeHtml(interventionData.technicianName || '')}</span>
    </td>
  </tr>
  <tr>
    <td class="bg bold upper small c-lbl">Numéro de la fiche</td>
    <td class="center c-val">${escapeHtml(interventionData.ficheNumber || '')}</td>
    <td class="bg bold upper small c-lbl2">Heure de sortie</td>
    <td class="center c-val2">${escapeHtml(interventionData.endTime || '………..…h………………')}</td>
  </tr>
  <tr>
    <td class="bg bold upper small c-lbl">Site</td>
    <td class="center c-val">${escapeHtml(interventionData.siteName || '')}</td>
    <td class="bg bold upper small c-lbl2">TOTAL</td>
    <td class="center c-val2">${escapeHtml(interventionData.totalTime || '…………..….')}</td>
  </tr>
</table>

<!-- TABLE 2 : Type d'intervention -->
<table class="t2">
  <thead>
    <tr>
      <th class="bg t2-lbl">Type<br/>d'intervention</th>
      ${TYPES.map((t) => `<th class="bg">${t}</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="bg t2-lbl"></td>
      ${TYPES.map((t) => `<td class="chk center">${t === currentType ? '&#10003;' : ''}</td>`).join('')}
    </tr>
  </tbody>
</table>

<!-- BLOC RÉSERVÉ À SOMACS SERVICE -->
<div class="bloc-res">
  <div class="res-bar"><span>Réservé à SOMACS SERVICE</span></div>
  <table class="res-tbl">
    <tr>
      <td class="bg bold upper small rl">Client</td>
      <td class="rv">${escapeHtml(interventionData.clientName || '')}</td>
      <td class="bg bold upper small rl2">Code client</td>
      <td class="rv2">${escapeHtml(interventionData.clientCode || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Adresse</td>
      <td colspan="3">${escapeHtml(interventionData.clientAddress || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Demandeur</td>
      <td class="rv">${escapeHtml(interventionData.requestorName || '')}</td>
      <td class="bg bold upper small rl2">Téléphone</td>
      <td class="rv2">${escapeHtml(interventionData.clientPhone || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">E-mail</td>
      <td colspan="3">${escapeHtml(interventionData.clientEmail || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Equipement</td>
      <td colspan="3">${escapeHtml(interventionData.machineType || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Marque</td>
      <td colspan="3">${escapeHtml(interventionData.machineBrand || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Modèle</td>
      <td colspan="3">${escapeHtml(interventionData.machineModel || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Numéro de série</td>
      <td colspan="3">${escapeHtml(interventionData.serialNumber || '')}</td>
    </tr>
    <tr>
      <td class="bg bold upper small rl">Type de panne</td>
      <td colspan="3">${escapeHtml(interventionData.problemDescription || '')}</td>
    </tr>
  </table>
</div>

<!-- DÉTAIL DE L'INTERVENTION -->
<div class="bloc-det">
  <div class="det-title">Détail de l'intervention</div>
  <div class="det-diag">
    <span class="bold upper" style="text-decoration:underline">Diagnostic téléphonique</span>
    &nbsp;&nbsp;${escapeHtml(interventionData.telephoneDiagnostic || '')}
  </div>
  <div class="det-body">${escapeHtml(interventionData.interventionDetail || '')}</div>
  <div class="det-essai">
    <div class="de-lbl">Nombre d'essai</div>
    <div class="de-val">${escapeHtml(String(interventionData.numEssai || ''))}</div>
    <div class="de-space"></div>
    <div class="de-conc">
      <div class="de-lbl">Essai concluant</div>
      <div class="de-oui">${essaiOui ? '&#10003;&nbsp;' : ''}Oui</div>
      <div class="de-non">${essaiNon ? '&#10003;&nbsp;' : ''}Non</div>
    </div>
  </div>
</div>

<!-- LES ARTICLES UTILISÉS -->
<div class="bloc-art">
  <div class="art-bar"><span>Les articles utilisés</span></div>
  <table class="art-tbl">
    <thead>
      <tr>
        <th class="art-ref">Référence</th>
        <th>Désignation</th>
        <th class="art-qty">Quantité</th>
      </tr>
    </thead>
    <tbody>
      ${partRows6.map((p) => `<tr>
        <td class="art-ref">${escapeHtml(p?.reference || '')}</td>
        <td>${escapeHtml(p?.designation || '')}</td>
        <td class="art-qty center">${escapeHtml(String(p?.quantity ?? ''))}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- PRIX M.O (HT) -->
<div class="prix-row">
  <div class="prix-box">
    <div class="prix-lbl">Prix M.O (HT) :</div>
    <div class="prix-val">${escapeHtml(String(laborPrice || ''))}</div>
  </div>
</div>

<!-- SIGNATURES -->
<div class="sig-row">
  <div class="sig-box">
    <div class="sig-ttl">Signature du technicien</div>
    <div class="sig-area"></div>
  </div>
  <div class="sig-box">
    <div class="sig-ttl">Signature et cachet client</div>
    <div class="sig-area"></div>
  </div>
</div>

<!-- FOOTER -->
<div class="ftr">
  <span>Adresse : 2/2 Rue El Fouledh ,Z.I &nbsp; Mégrine Riadh 2014 Ben Arous &nbsp;&nbsp;&nbsp; GSM : 98326746 &nbsp;&nbsp; Tel : 71296493</span>
  <span><strong>MF : 1420197A/A/M/000</strong></span>
</div>

</body>
</html>`
}
