import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

interface Offense {
  uccs_code: number
  uccs_desc: string
}

interface Decision {
  id: string
  uccs_code: number
  collaborator_email: string
  decision_level: 'Green' | 'Yellow' | 'Red'
  look_back_period?: number
  updated_at: string
}

const App: React.FC = () => {
  const [offenses, setOffenses] = useState<Offense[]>([])
  const [decisionsList, setDecisionsList] = useState<Decision[]>([])
  const [selectedOffense, setSelectedOffense] = useState<number | null>(null)
  const [decision, setDecision] = useState<'Green' | 'Yellow' | 'Red'>('Green')
  const [lookBackYears, setLookBackYears] = useState<number>(3)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')

  const MATRIX_ID = import.meta.env.VITE_MATRIX_ID || 'your-matrix-id-from-supabase'
  const COLLABORATOR_EMAIL = import.meta.env.VITE_COLLABORATOR_EMAIL || 'hiring.manager@example.com'

  useEffect(() => {
    const fetchData = async () => {
      const { data: offensesData, error: offensesError } = await supabase
        .from('uccs_offenses')
        .select('uccs_code, uccs_desc')
        .order('uccs_code')
      if (offensesError) console.error('Error fetching offenses:', offensesError)
      else setOffenses(offensesData || [])

      const { data: decisionsData, error: decisionsError } = await supabase
        .from('decisions')
        .select('id, uccs_code, collaborator_email, decision_level, updated_at')
        .eq('matrix_id', MATRIX_ID)
      if (decisionsError) console.error('Error fetching decisions:', decisionsError)
      else setDecisionsList(decisionsData || [])
    }

    fetchData()

    const channel = supabase
      .channel('decisions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'decisions', filter: `matrix_id=eq.${MATRIX_ID}` },
        (payload) => {
          const newDecision = payload.new as Decision
          setDecisionsList((currentList) => {
            const existingIndex = currentList.findIndex((d) => d.id === newDecision.id)
            if (existingIndex > -1) {
              const newList = [...currentList]
              newList[existingIndex] = newDecision
              return newList
            } else {
              return [...currentList, newDecision]
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [MATRIX_ID])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOffense) {
      setMessage('Please select an offense.')
      return
    }
    setIsLoading(true)
    setMessage('')

    try {
      // Check if a decision already exists for this matrix_id / collaborator / offense
      const { data: existingData, error: fetchErr } = await supabase
        .from('decisions')
        .select('id')
        .match({ matrix_id: MATRIX_ID, collaborator_email: COLLABORATOR_EMAIL, uccs_code: selectedOffense })
        .limit(1)

      if (fetchErr) {
        throw fetchErr
      }

      if (existingData && existingData.length > 0) {
        const existingId = (existingData as any)[0].id
        const { error } = await supabase.from('decisions').update({
          decision_level: decision,
          look_back_period: lookBackYears,
        }).eq('id', existingId)

        if (error) throw error
        setMessage('Decision updated successfully! ✅')
      } else {
        const { error } = await supabase.from('decisions').insert({
          matrix_id: MATRIX_ID,
          collaborator_email: COLLABORATOR_EMAIL,
          uccs_code: selectedOffense,
          decision_level: decision,
          look_back_period: lookBackYears,
        })

        if (error) throw error
        setMessage('Decision submitted successfully! ✅')
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message || String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Pre-Adjudication Matrix</h1>
      <p>Select an offense and classify it. Changes will appear in the list below in real-time.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="offense">Offense</label>
        <select id="offense" value={selectedOffense ?? ''} onChange={(e) => setSelectedOffense(Number(e.target.value))}>
          <option value="">-- Select an offense --</option>
          {offenses.map((o) => (
            <option key={o.uccs_code} value={o.uccs_code}>{o.uccs_code} - {o.uccs_desc}</option>
          ))}
        </select>

        <label>Decision</label>
        <div>
          <label>
            <input type="radio" name="decision" value="Green" checked={decision === 'Green'} onChange={() => setDecision('Green')} /> Green
          </label>
          <label>
            <input type="radio" name="decision" value="Yellow" checked={decision === 'Yellow'} onChange={() => setDecision('Yellow')} /> Yellow
          </label>
          <label>
            <input type="radio" name="decision" value="Red" checked={decision === 'Red'} onChange={() => setDecision('Red')} /> Red
          </label>
        </div>

  <label htmlFor="lookback">Look-back period (years)</label>
  <input id="lookback" type="number" min={0} step={1} value={lookBackYears} onChange={(e) => setLookBackYears(Number(e.target.value))} />

  <button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Submit Decision'}</button>
      </form>

      {message && <p className="message">{message}</p>}

      <div className="decisions-list">
        <h2>Live Decisions</h2>
        {decisionsList.length === 0 ? (
          <p>No decisions made for this matrix yet.</p>
        ) : (
          decisionsList.map((d) => (
            <div key={d.id} className="decision-item">
              <span><strong>Code:</strong> {d.uccs_code} ({d.collaborator_email.split('@')[0]})</span>
              <span className={`pill pill-${d.decision_level.toLowerCase()}`}>{d.decision_level}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App
