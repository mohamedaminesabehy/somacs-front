import { Loader2, NotebookPen, Save } from 'lucide-react'
import { DetailCard } from './DetailCard'

export default function MissionNotesCard({ notes, setNotes, onSave, isSaving }) {
  return (
    <DetailCard icon={NotebookPen} title="Notes et observations">
      <div className="flex flex-col gap-3">
        <label htmlFor="mission-notes" className="sr-only">Notes et observations</label>
        <textarea
          id="mission-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Remarques, observations ou détails techniques..."
          className="ui-textarea min-h-32 resize-y text-[15px] leading-relaxed"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink-faint">Visible par toute l’équipe.</p>
          <button type="button" onClick={onSave} disabled={isSaving} className="ui-btn-primary">
            {isSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            Enregistrer
          </button>
        </div>
      </div>
    </DetailCard>
  )
}
