"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { useMasanielloStore } from "@/stores/masaniello-store"
import { translations } from "@/lib/translations"
import type { Language, Session } from "@/types"

interface SessionManagerProps {
  lang: Language
  sessionId: string
}

export function SessionManager({ lang, sessionId }: SessionManagerProps) {
  const router = useRouter()
  const { sessions, createSession, deleteSession, updateSessionName, setActiveSession } = useMasanielloStore()
  const t = translations[lang]

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newSessionName, setNewSessionName] = useState("")
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null)
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null)
  const [editSessionName, setEditSessionName] = useState("")

  const openCreateModal = () => {
    setNewSessionName(`${t.defaultSessionName} ${sessions.length + 1}`)
    setShowCreateModal(true)
  }

  const confirmCreateSession = () => {
    if (!newSessionName.trim()) return
    createSession(newSessionName.trim())
    const newSession = useMasanielloStore.getState().sessions.at(-1)
    if (newSession) {
      router.push(`/${lang}/session/${newSession.id}`)
    }
    setShowCreateModal(false)
    setNewSessionName("")
  }

  const openDeleteModal = (session: Session) => {
    setSessionToDelete(session)
    setShowDeleteModal(true)
  }

  const confirmDeleteSession = () => {
    if (!sessionToDelete || sessions.length <= 1) return
    const wasActive = sessionToDelete.id === sessionId
    deleteSession(sessionToDelete.id)
    if (wasActive) {
      const remainingSessions = useMasanielloStore.getState().sessions
      if (remainingSessions.length > 0) {
        router.push(`/${lang}/session/${remainingSessions[0].id}`)
      }
    }
    setShowDeleteModal(false)
    setSessionToDelete(null)
  }

  const openEditModal = (session: Session) => {
    setSessionToEdit(session)
    setEditSessionName(session.name)
    setShowEditModal(true)
  }

  const confirmEditSession = () => {
    if (!sessionToEdit || !editSessionName.trim()) return
    updateSessionName(sessionToEdit.id, editSessionName.trim())
    setShowEditModal(false)
    setSessionToEdit(null)
    setEditSessionName("")
  }

  const handleSelectSession = (id: string) => {
    setActiveSession(id)
    router.push(`/${lang}/session/${id}`)
  }

  return (
    <>
      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <h2 className="text-xl font-bold">{t.createSession}</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">{t.enterSessionName}</label>
          <Input
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder={t.sessionName}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && confirmCreateSession()}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>
            {t.cancel}
          </Button>
          <Button onClick={confirmCreateSession} disabled={!newSessionName.trim()}>
            {t.create}
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <h2 className="text-xl font-bold text-destructive">{t.confirmDelete}</h2>
        <p className="text-muted-foreground">
          {t.deleteSessionConfirm} <span className="font-semibold text-foreground">"{sessionToDelete?.name}"</span>?
        </p>
        <p className="text-sm text-muted-foreground">{t.thisActionCannot}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            {t.cancel}
          </Button>
          <Button variant="destructive" onClick={confirmDeleteSession}>
            {t.delete}
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <h2 className="text-xl font-bold">{t.editSession}</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">{t.sessionName}</label>
          <Input
            value={editSessionName}
            onChange={(e) => setEditSessionName(e.target.value)}
            placeholder={t.sessionName}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && confirmEditSession()}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowEditModal(false)}>
            {t.cancel}
          </Button>
          <Button onClick={confirmEditSession} disabled={!editSessionName.trim()}>
            {t.save}
          </Button>
        </div>
      </Modal>

      {/* Session Tabs */}
      <Card className="overflow-hidden py-0">
        <div className="bg-primary text-primary-foreground px-3 py-1.5 flex justify-between items-center">
          <span className="font-bold text-lg">{t.sessions}</span>
          <Button onClick={openCreateModal} size="sm" variant="secondary" className="h-7 px-2 gap-1">
            <Plus className="h-3.5 w-3.5" />
            {t.newSession}
          </Button>
        </div>
        <div className="p-2 flex gap-2 flex-wrap">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors cursor-pointer ${
                sessionId === session.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 hover:bg-muted border-border"
              }`}
            >
              <span className="font-medium text-sm">{session.name}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openEditModal(session)
                  }}
                  className={`p-1 rounded hover:bg-white/20 transition-colors ${
                    sessionId === session.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={t.edit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {sessions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openDeleteModal(session)
                    }}
                    className={`p-1 rounded hover:bg-destructive/20 transition-colors ${
                      sessionId === session.id ? "text-primary-foreground" : "text-destructive"
                    }`}
                    title={t.deleteSession}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
