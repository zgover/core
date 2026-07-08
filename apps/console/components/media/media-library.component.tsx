/**
 * @license
 * Copyright 2026 Aglyn LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use client'

import * as Aglyn from '@aglyn/aglyn'
import { useConfirmationContext } from '@aglyn/shared-ui-jsx'
import { useSnackbar } from '@aglyn/shared-ui-snackstack'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardMedia,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Link,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  collection,
  doc,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  useFirestore,
  useFirestoreCollectionData,
  useUser,
} from 'reactfire'
import { checkTenantQuota } from '../../constants/entitlements'
import useCurrentTenant from '../../hooks/use-current-tenant'
import useHostActivityLogger from '../../hooks/use-host-activity-logger'
import { MediaFolderRail } from './media-folder-rail.component'

export interface MediaLibraryComponentProps {
  hostId: string
  /** When set, clicking an item selects it instead of exposing row actions. */
  onSelect?: (media: Aglyn.AglynHostMedia) => void
}

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${bytes === 0 ? 0 : Math.max(1, Math.round(bytes / 1024))} KB`

/**
 * Drag wrapper for an asset card (AGL-172): drag id `media:{mediaId}`.
 * Disabled in picker mode where clicking selects instead.
 */
function DraggableCard(props: {
  mediaId: string
  disabled?: boolean
  children: React.ReactNode
}) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `media:${props.mediaId}`,
    disabled: props.disabled,
  })
  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      sx={{ opacity: isDragging ? 0.4 : 1 }}
    >
      {props.children}
    </Box>
  )
}
DraggableCard.displayName = 'DraggableCard'

/** File → base64 (payload for the upload API). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const result = String(reader.result ?? '')
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Per-host media library (AGL-72/73): files live in Firebase Storage at
 * `hosts/{hostId}/media/{mediaId}` with a Firestore metadata mirror and a
 * bytes counter doc (`counters/media`) that feeds the storage quota meter.
 * Uploads/deletes go through `/api/media/upload` (AGL-85) — Storage rules
 * deny client writes, so auth, admin membership, and quota are enforced
 * server-side; the quota check here is just a friendlier early error.
 * Doubles as the browse grid inside MediaPickerDialog via `onSelect`.
 */
export function MediaLibraryComponent(props: MediaLibraryComponentProps) {
  const { hostId, onSelect } = props
  const firestore = useFirestore()
  const { data: user } = useUser()
  const { enqueueSnackbar } = useSnackbar()
  const { confirm } = useConfirmationContext()
  const { tenant } = useCurrentTenant()
  const logActivity = useHostActivityLogger(hostId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const { data: mediaDocs } = useFirestoreCollectionData<any>(
    query(collection(firestore, 'hosts', hostId, 'media'), limit(500)),
    { idField: '$id' },
  )
  const items: Aglyn.AglynHostMedia[] = [...(mediaDocs ?? [])]
    .filter((item: any) => !item.deletedAt)
    .sort(
      (a: any, b: any) =>
        (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0),
    )
  const usedBytes = items.reduce(
    (sum, item) => sum + (item.sizeBytes ?? 0),
    0,
  )

  // Folder hierarchy (AGL-171): first-class docs replace the AGL-124
  // free-text `folder` string. Legacy strings migrate lazily below.
  const { data: folderDocs } = useFirestoreCollectionData<any>(
    query(collection(firestore, 'hosts', hostId, 'mediaFolders'), limit(500)),
    { idField: '$id' },
  )
  const folderList: Array<Aglyn.AglynHostMediaFolder> = useMemo(
    () =>
      [...((folderDocs as any[]) ?? [])].sort(
        (a, b) =>
          (a.order ?? 0) - (b.order ?? 0) ||
          String(a.name).localeCompare(String(b.name)),
      ),
    [folderDocs],
  )
  const folderNameById = useMemo(
    () =>
      Object.fromEntries(folderList.map((folder) => [folder.$id, folder.name])),
    [folderList],
  )

  // One-shot legacy migration: create a root folder per distinct legacy
  // string and stamp `folderId` on its assets. Client-side under the
  // host-admin rules; ref-guarded so a mount runs it at most once.
  const migratedRef = useRef(false)
  useEffect(() => {
    if (migratedRef.current || !mediaDocs || !folderDocs) return
    const plan = Aglyn.planLegacyFolderMigration(
      mediaDocs as any[],
      folderDocs as any[],
    )
    if (!plan.assignments.length && !plan.foldersToCreate.length) return
    migratedRef.current = true
    const batch = writeBatch(firestore)
    const idByName: Record<string, string> = {}
    for (const folder of folderDocs as any[]) {
      if ((folder.parentId ?? null) === null) {
        idByName[String(folder.name).trim().toLowerCase()] = folder.$id
      }
    }
    for (const name of plan.foldersToCreate) {
      const ref = doc(collection(firestore, 'hosts', hostId, 'mediaFolders'))
      idByName[name.toLowerCase()] = ref.id
      batch.set(ref, { name, parentId: null, createdAt: serverTimestamp() })
    }
    for (const assignment of plan.assignments) {
      const folderId = idByName[assignment.folderName.toLowerCase()]
      if (!folderId) continue
      batch.update(doc(firestore, 'hosts', hostId, 'media', assignment.mediaId), {
        folderId,
      })
    }
    batch.commit().catch((error) => console.error('media migration', error))
  }, [mediaDocs, folderDocs, firestore, hostId])

  // Organization (AGL-124): search + folder/tag filters over doc metadata.
  const [search, setSearch] = useState('')
  // Folder scoping (AGL-172): 'all' = every file, null = root/no folder.
  const [currentFolder, setCurrentFolder] = useState<string | null | 'all'>(
    'all',
  )
  const [tagFilter, setTagFilter] = useState('')
  // Sorting + type/date/size filters (AGL-134).
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>(
    'newest',
  )
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [sizeFilter, setSizeFilter] = useState('')
  const folderNames = useMemo(
    () => folderList.map((folder) => folder.name),
    [folderList],
  )
  const tags = useMemo(
    () =>
      [...new Set(items.flatMap((item: any) => item.tags ?? []))].sort(),
    [items],
  )
  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    const now = Date.now() / 1000
    const filtered = items.filter((item: any) => {
      if (currentFolder === null && (item.folderId || item.folder)) {
        return false
      }
      if (
        typeof currentFolder === 'string' &&
        currentFolder !== 'all' &&
        item.folderId !== currentFolder &&
        // Legacy fallback: unmigrated docs match by folder name.
        item.folder !== folderNameById[currentFolder]
      ) {
        return false
      }
      if (tagFilter && !(item.tags ?? []).includes(tagFilter)) return false
      const contentType = String(item.contentType ?? '')
      if (typeFilter === 'image' && !contentType.startsWith('image/')) {
        return false
      }
      if (typeFilter === 'video' && !contentType.startsWith('video/')) {
        return false
      }
      if (typeFilter === 'pdf' && contentType !== 'application/pdf') {
        return false
      }
      const createdSeconds = item.createdAt?.seconds ?? 0
      if (dateFilter === '7d' && now - createdSeconds > 7 * 86400) return false
      if (dateFilter === '30d' && now - createdSeconds > 30 * 86400) {
        return false
      }
      const sizeBytes = item.sizeBytes ?? 0
      if (sizeFilter === '1mb' && sizeBytes < 1024 * 1024) return false
      if (sizeFilter === '5mb' && sizeBytes < 5 * 1024 * 1024) return false
      if (!term) return true
      const haystack = [
        item.fileName,
        item.folder,
        item.folderId ? folderNameById[item.folderId] : undefined,
        item.alt,
        item.description,
        ...(item.tags ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
    return [...filtered].sort((a: any, b: any) => {
      if (sortBy === 'name') {
        return String(a.fileName ?? '').localeCompare(String(b.fileName ?? ''))
      }
      if (sortBy === 'size') return (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0)
      if (sortBy === 'oldest') {
        return (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0)
      }
      return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
    })
  }, [
    items,
    search,
    currentFolder,
    folderNameById,
    tagFilter,
    typeFilter,
    dateFilter,
    sizeFilter,
    sortBy,
  ])

  // Rail counts: per-folder asset totals plus a `root` bucket.
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of items as any[]) {
      const key = item.folderId ?? 'root'
      counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
  }, [items])

  // Breadcrumb chain for the open folder.
  const breadcrumb = useMemo(() => {
    if (typeof currentFolder !== 'string' || currentFolder === 'all') return []
    const foldersById = Object.fromEntries(
      folderList.map((folder) => [folder.$id, folder]),
    )
    const chain: Aglyn.AglynHostMediaFolder[] = []
    let cursor: string | null | undefined = currentFolder
    const seen = new Set<string>()
    while (cursor && foldersById[cursor] && !seen.has(cursor)) {
      seen.add(cursor)
      chain.unshift(foldersById[cursor])
      cursor = foldersById[cursor].parentId
    }
    return chain
  }, [currentFolder, folderList])

  // Folder CRUD (AGL-172) — shared validation from app-utils so the UI
  // can't create what enforcement would refuse.
  const foldersById = useMemo(
    () =>
      Object.fromEntries(folderList.map((folder) => [folder.$id, folder])),
    [folderList],
  )
  const handleFolderCreate = useCallback(
    async (rawName: string, parentId: string | null) => {
      const name = Aglyn.normalizeFolderName(rawName)
      if (!name) return null
      if (Aglyn.isSiblingNameTaken(name, parentId, folderList as any)) {
        enqueueSnackbar('A folder with that name already exists here', {
          variant: 'warning',
          persist: false,
        })
        return null
      }
      const parentDepth = parentId
        ? Aglyn.folderDepth(parentId, foldersById as any)
        : 0
      if (parentDepth + 1 > Aglyn.MEDIA_FOLDER_MAX_DEPTH) {
        enqueueSnackbar(
          `Folders can nest at most ${Aglyn.MEDIA_FOLDER_MAX_DEPTH} levels`,
          { variant: 'warning', persist: false },
        )
        return null
      }
      const ref = doc(collection(firestore, 'hosts', hostId, 'mediaFolders'))
      const batch = writeBatch(firestore)
      batch.set(ref, { name, parentId, createdAt: serverTimestamp() })
      await batch.commit()
      logActivity('Created media folder', { type: 'media', name })
      return ref.id
    },
    [firestore, hostId, folderList, foldersById, enqueueSnackbar, logActivity],
  )
  const handleFolderRename = useCallback(
    async (folder: Aglyn.AglynHostMediaFolder, rawName: string) => {
      const name = Aglyn.normalizeFolderName(rawName)
      if (!name) return
      if (
        Aglyn.isSiblingNameTaken(
          name,
          folder.parentId ?? null,
          folderList as any,
          folder.$id,
        )
      ) {
        return void enqueueSnackbar(
          'A folder with that name already exists here',
          { variant: 'warning', persist: false },
        )
      }
      await updateDoc(
        doc(firestore, 'hosts', hostId, 'mediaFolders', folder.$id),
        { name },
      )
    },
    [firestore, hostId, folderList, enqueueSnackbar],
  )
  const handleFolderDelete = useCallback(
    async (folder: Aglyn.AglynHostMediaFolder) => {
      const confirmed = await confirm({
        title: `Delete folder "${folder.name}"?`,
        description:
          'Its subfolders and files move up to the parent folder — nothing ' +
          'is deleted from storage.',
        confirmationText: 'Delete folder',
        confirmationButtonProps: { color: 'error' },
      })
        .then(() => true)
        .catch(() => false)
      if (!confirmed) return
      const parentId = folder.parentId ?? null
      const batch = writeBatch(firestore)
      // Documented AGL-171 policy: re-parent children and assets.
      for (const child of folderList) {
        if ((child.parentId ?? null) === folder.$id) {
          batch.update(
            doc(firestore, 'hosts', hostId, 'mediaFolders', child.$id),
            { parentId },
          )
        }
      }
      for (const item of items as any[]) {
        if (item.folderId === folder.$id) {
          batch.update(doc(firestore, 'hosts', hostId, 'media', item.$id), {
            folderId: parentId,
          })
        }
      }
      batch.delete(doc(firestore, 'hosts', hostId, 'mediaFolders', folder.$id))
      await batch.commit()
      if (currentFolder === folder.$id) setCurrentFolder(parentId ?? 'all')
      logActivity('Deleted media folder', { type: 'media', name: folder.name })
    },
    [
      confirm,
      firestore,
      hostId,
      folderList,
      items,
      currentFolder,
      logActivity,
    ],
  )

  // Multi-select + move (AGL-172): checkboxes are the accessible path;
  // dragging a selected card moves the whole selection.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [moveAnchor, setMoveAnchor] = useState<HTMLElement | null>(null)
  const moveMedia = useCallback(
    async (mediaIds: string[], folderId: string | null) => {
      if (!mediaIds.length) return
      const batch = writeBatch(firestore)
      for (const mediaId of mediaIds) {
        batch.update(doc(firestore, 'hosts', hostId, 'media', mediaId), {
          folderId,
          folder: folderId ? (folderNameById[folderId] ?? '') : '',
        })
      }
      await batch.commit()
      setSelected(new Set())
      enqueueSnackbar(
        `Moved ${mediaIds.length} file${mediaIds.length === 1 ? '' : 's'}`,
        { variant: 'success', persist: false },
      )
    },
    [firestore, hostId, folderNameById, enqueueSnackbar],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeId = String(event.active.id)
      const overId = event.over ? String(event.over.id) : null
      if (!overId || !overId.startsWith('folder:')) return
      const targetId = overId === 'folder:root' ? null : overId.slice(7)
      if (activeId.startsWith('media:')) {
        const mediaId = activeId.slice(6)
        const ids = selected.has(mediaId) ? [...selected] : [mediaId]
        void moveMedia(ids, targetId)
        return
      }
      if (activeId.startsWith('folderdrag:')) {
        const folderId = activeId.slice(11)
        if (folderId === targetId) return
        if (
          targetId &&
          Aglyn.wouldCreateCycle(folderId, targetId, foldersById as any)
        ) {
          return void enqueueSnackbar(
            'Cannot move a folder into itself or its subfolders',
            { variant: 'warning', persist: false },
          )
        }
        const folder = foldersById[folderId]
        if (!folder) return
        if (
          Aglyn.isSiblingNameTaken(
            folder.name,
            targetId,
            folderList as any,
            folderId,
          )
        ) {
          return void enqueueSnackbar(
            'A folder with that name already exists there',
            { variant: 'warning', persist: false },
          )
        }
        const targetDepth = targetId
          ? Aglyn.folderDepth(targetId, foldersById as any)
          : 0
        if (targetDepth + 1 > Aglyn.MEDIA_FOLDER_MAX_DEPTH) {
          return void enqueueSnackbar(
            `Folders can nest at most ${Aglyn.MEDIA_FOLDER_MAX_DEPTH} levels`,
            { variant: 'warning', persist: false },
          )
        }
        void updateDoc(
          doc(firestore, 'hosts', hostId, 'mediaFolders', folderId),
          { parentId: targetId },
        )
      }
    },
    [
      selected,
      moveMedia,
      foldersById,
      folderList,
      firestore,
      hostId,
      enqueueSnackbar,
    ],
  )

  // Metadata editor (folder, tags, alt text, description) — metadata lives
  // on the Firestore mirror doc, so host admins edit it client-side.
  const [editor, setEditor] = useState<{
    id: string
    fileName: string
    folder: string
    tags: string
    alt: string
    description: string
  } | null>(null)
  const handleEditorSave = useCallback(async () => {
    if (!editor) return
    const tagList = [
      ...new Set(
        editor.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ]
    // Resolve the typed folder name to a folder doc (AGL-171): reuse a
    // root folder case-insensitively or create one; empty name = root.
    const folderName = Aglyn.normalizeFolderName(editor.folder)
    let folderId: string | null = null
    if (folderName) {
      const existing = folderList.find(
        (folder) =>
          (folder.parentId ?? null) === null &&
          folder.name.trim().toLowerCase() === folderName.toLowerCase(),
      )
      if (existing) {
        folderId = existing.$id
      } else {
        const ref = doc(collection(firestore, 'hosts', hostId, 'mediaFolders'))
        const batch = writeBatch(firestore)
        batch.set(ref, {
          name: folderName,
          parentId: null,
          createdAt: serverTimestamp(),
        })
        await batch.commit()
        folderId = ref.id
      }
    }
    await updateDoc(doc(firestore, 'hosts', hostId, 'media', editor.id), {
      folderId,
      // Legacy string kept in sync until every reader is on folderId.
      folder: folderName ?? '',
      tags: tagList,
      alt: editor.alt.trim(),
      description: editor.description.trim(),
    })
      .then(() => {
        enqueueSnackbar('Media details saved', {
          variant: 'success',
          persist: false,
        })
        logActivity('Updated media details', {
          type: 'media',
          id: editor.id,
          name: editor.fileName,
        })
        setEditor(null)
      })
      .catch(() =>
        enqueueSnackbar('An error has occurred', { variant: 'error' }),
      )
  }, [editor, folderList, firestore, hostId, enqueueSnackbar, logActivity])

  const handleUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      const allowed =
        file.type.startsWith('image/') ||
        ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type) ||
        file.type === 'application/pdf'
      if (!allowed) {
        return void enqueueSnackbar(
          'Supported uploads: images, mp4/webm video, PDF',
          { variant: 'warning', persist: false },
        )
      }
      const usedMb = (usedBytes + file.size) / (1024 * 1024)
      const quota = checkTenantQuota(tenant, 'storagePerHostMb', usedMb - 1)
      if (!quota.allowed) {
        return void enqueueSnackbar(
          `Storage limit reached (${quota.limit} MB) — see Billing to upgrade`,
          { variant: 'warning', persist: false },
        )
      }

      setBusy(true)
      // Uploads land in the currently open folder (AGL-172).
      const uploadFolderId =
        typeof currentFolder === 'string' && currentFolder !== 'all'
          ? currentFolder
          : null
      try {
        const idToken = await (user as any)?.getIdToken?.()
        // Large video goes direct-to-storage via signed URLs (AGL-167) —
        // base64 JSON bodies cap out around 25MB.
        if (file.type.startsWith('video/') && file.size > 20 * 1024 * 1024) {
          const mint = await fetch('/api/media/upload-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({
              hostId,
              contentType: file.type,
              sizeBytes: file.size,
            }),
          })
          const minted = await mint.json().catch(() => ({}))
          if (!mint.ok || !minted?.uploadUrl) {
            return void enqueueSnackbar(minted?.error ?? 'Upload failed', {
              variant: 'error',
              allowDuplicate: true,
            })
          }
          const put = await fetch(minted.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          })
          if (!put.ok) {
            return void enqueueSnackbar('Upload failed — try again', {
              variant: 'error',
              allowDuplicate: true,
            })
          }
          const finalize = await fetch('/api/media/upload-url', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({
              hostId,
              mediaId: minted.mediaId,
              fileName: file.name,
              folderId: uploadFolderId,
            }),
          })
          const finalized = await finalize.json().catch(() => ({}))
          if (!finalize.ok) {
            return void enqueueSnackbar(
              finalized?.error ?? 'Upload failed',
              { variant: 'error', allowDuplicate: true },
            )
          }
          enqueueSnackbar(`Uploaded "${file.name}"`, {
            variant: 'success',
            persist: false,
          })
          logActivity('Uploaded media', { type: 'media', name: file.name })
          return
        }
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({
            hostId,
            fileName: file.name,
            contentType: file.type,
            folderId: uploadFolderId,
            data: await fileToBase64(file),
          }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          return void enqueueSnackbar(payload?.error ?? 'Upload failed', {
            variant: 'error',
            allowDuplicate: true,
          })
        }
        enqueueSnackbar(`Uploaded "${file.name}"`, {
          variant: 'success',
          persist: false,
        })
        logActivity('Uploaded media', { type: 'media', name: file.name })
      } catch (error) {
        console.error(error)
        enqueueSnackbar('Upload failed', {
          variant: 'error',
          allowDuplicate: true,
        })
      } finally {
        setBusy(false)
      }
    },
    [user, hostId, tenant, usedBytes, currentFolder, enqueueSnackbar, logActivity],
  )

  const handleCopyUrl = useCallback(
    (media: Aglyn.AglynHostMedia) => () => {
      if (!media.url) return
      void navigator.clipboard.writeText(media.url)
      enqueueSnackbar('URL copied — paste it into an Image or Video element', {
        variant: 'success',
        persist: false,
      })
    },
    [enqueueSnackbar],
  )

  const handleDelete = useCallback(
    (media: Aglyn.AglynHostMedia) => async () => {
      const confirmed = await confirm({
        title: 'Delete this file?',
        description:
          `"${media.fileName ?? media.$id}" will be removed from storage. ` +
          'Elements using its URL will stop rendering it.',
        confirmationText: 'Delete',
        confirmationButtonProps: { color: 'error' },
      })
        .then(() => true)
        .catch(() => false)
      if (!confirmed) return
      try {
        const idToken = await (user as any)?.getIdToken?.()
        const response = await fetch('/api/media/upload', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ hostId, mediaId: media.$id }),
        })
        if (!response.ok) throw new Error(`Delete failed (${response.status})`)
        enqueueSnackbar('File deleted', { variant: 'success', persist: false })
        logActivity('Deleted media', {
          type: 'media',
          id: media.$id,
          name: media.fileName ?? media.$id,
        })
      } catch (error) {
        console.error(error)
        enqueueSnackbar('An error has occurred', {
          variant: 'error',
          allowDuplicate: true,
        })
      }
    },
    [confirm, user, hostId, enqueueSnackbar, logActivity],
  )

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <MediaFolderRail
          folders={folderList as any}
          current={currentFolder}
          onSelect={setCurrentFolder}
          counts={folderCounts}
          onCreate={handleFolderCreate}
          onRename={handleFolderRename}
          onDelete={handleFolderDelete}
          readOnly={Boolean(onSelect)}
        />
        <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Button
          variant="contained"
          color="secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {'Upload media'}
        </Button>
        <Typography variant="body2" color="text.secondary">
          {`${items.length} file${items.length === 1 ? '' : 's'} · ${formatBytes(usedBytes)} used`}
        </Typography>
        <Box
          component="input"
          ref={inputRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime,application/pdf"
          onChange={handleUpload}
          sx={{ display: 'none' }}
        />
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}
      >
        <TextField
          size="small"
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          size="small"
          label="Type"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          sx={{ minWidth: 110 }}
        >
          <MenuItem value="">{'All types'}</MenuItem>
          <MenuItem value="image">{'Images'}</MenuItem>
          <MenuItem value="video">{'Video'}</MenuItem>
          <MenuItem value="pdf">{'PDF'}</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Uploaded"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">{'Any time'}</MenuItem>
          <MenuItem value="7d">{'Last 7 days'}</MenuItem>
          <MenuItem value="30d">{'Last 30 days'}</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Size"
          value={sizeFilter}
          onChange={(event) => setSizeFilter(event.target.value)}
          sx={{ minWidth: 110 }}
        >
          <MenuItem value="">{'Any size'}</MenuItem>
          <MenuItem value="1mb">{'Over 1 MB'}</MenuItem>
          <MenuItem value="5mb">{'Over 5 MB'}</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Sort"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as any)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="newest">{'Newest'}</MenuItem>
          <MenuItem value="oldest">{'Oldest'}</MenuItem>
          <MenuItem value="name">{'Name'}</MenuItem>
          <MenuItem value="size">{'Largest'}</MenuItem>
        </TextField>
        {tags.length ? (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                color={tagFilter === tag ? 'secondary' : 'default'}
                onClick={() =>
                  setTagFilter((prev) => (prev === tag ? '' : tag))
                }
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
      {breadcrumb.length ? (
        <Breadcrumbs>
          <Link
            component="button"
            variant="body2"
            underline="hover"
            color="inherit"
            onClick={() => setCurrentFolder('all')}
          >
            {'All files'}
          </Link>
          {breadcrumb.map((folder, index) =>
            index === breadcrumb.length - 1 ? (
              <Typography key={folder.$id} variant="body2">
                {folder.name}
              </Typography>
            ) : (
              <Link
                key={folder.$id}
                component="button"
                variant="body2"
                underline="hover"
                color="inherit"
                onClick={() => setCurrentFolder(folder.$id)}
              >
                {folder.name}
              </Link>
            ),
          )}
        </Breadcrumbs>
      ) : null}
      {!onSelect && selected.size ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2">
            {`${selected.size} selected`}
          </Typography>
          <Button
            size="small"
            onClick={(event) => setMoveAnchor(event.currentTarget)}
          >
            {'Move to folder…'}
          </Button>
          <Button size="small" onClick={() => setSelected(new Set())}>
            {'Clear'}
          </Button>
          <Menu
            anchorEl={moveAnchor}
            open={Boolean(moveAnchor)}
            onClose={() => setMoveAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setMoveAnchor(null)
                void moveMedia([...selected], null)
              }}
            >
              {'No folder'}
            </MenuItem>
            {folderList.map((folder) => (
              <MenuItem
                key={folder.$id}
                onClick={() => {
                  setMoveAnchor(null)
                  void moveMedia([...selected], folder.$id)
                }}
              >
                {folder.name}
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      ) : null}
      {busy ? <LinearProgress /> : null}
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {'No media yet — upload images, video, or PDFs to use on your site.'}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {visibleItems.map((media: any) => (
            <Grid key={media.$id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
              <DraggableCard
                mediaId={media.$id as string}
                disabled={Boolean(onSelect)}
              >
              <Card variant="outlined" sx={{ position: 'relative' }}>
                {onSelect ? null : (
                  <Checkbox
                    size="small"
                    checked={selected.has(media.$id as string)}
                    onPointerDown={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      setSelected((prev) => {
                        const next = new Set(prev)
                        if (event.target.checked) next.add(media.$id as string)
                        else next.delete(media.$id as string)
                        return next
                      })
                    }
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      zIndex: 1,
                      bgcolor: 'background.paper',
                      borderRadius: '0 0 0 8px',
                      p: 0.25,
                    }}
                  />
                )}
                {String(media.contentType ?? '').startsWith('video/') ? (
                  <CardMedia
                    component="video"
                    src={media.url}
                    muted
                    onClick={onSelect ? () => onSelect(media) : undefined}
                    sx={{
                      height: 96,
                      objectFit: 'cover',
                      cursor: onSelect ? 'pointer' : undefined,
                    }}
                  />
                ) : media.contentType === 'application/pdf' ? (
                  <CardMedia
                    onClick={onSelect ? () => onSelect(media) : undefined}
                    sx={{
                      height: 96,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'action.hover',
                      typography: 'caption',
                      color: 'text.secondary',
                      cursor: onSelect ? 'pointer' : undefined,
                    }}
                  >
                    {'PDF'}
                  </CardMedia>
                ) : (
                  <CardMedia
                    component="img"
                    image={media.url}
                    alt={media.fileName ?? ''}
                    onClick={onSelect ? () => onSelect(media) : undefined}
                    sx={{
                      height: 96,
                      objectFit: 'cover',
                      cursor: onSelect ? 'pointer' : undefined,
                    }}
                  />
                )}
                <Box sx={{ px: 1, pt: 0.5 }}>
                  <Typography variant="caption" noWrap component="div">
                    {media.fileName ?? media.$id}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="div"
                  >
                    {formatBytes(media.sizeBytes ?? 0)}
                  </Typography>
                </Box>
                <CardActions sx={{ pt: 0 }}>
                  {onSelect ? (
                    <Button size="small" onClick={() => onSelect(media)}>
                      {'Select'}
                    </Button>
                  ) : (
                    <>
                      <Button size="small" onClick={handleCopyUrl(media)}>
                        {'Copy URL'}
                      </Button>
                      <Button
                        size="small"
                        onClick={() =>
                          setEditor({
                            id: media.$id as string,
                            fileName: media.fileName ?? (media.$id as string),
                            folder: (media as any).folder ?? '',
                            tags: ((media as any).tags ?? []).join(', '),
                            alt: (media as any).alt ?? '',
                            description: (media as any).description ?? '',
                          })
                        }
                      >
                        {'Details'}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={handleDelete(media)}
                      >
                        {'Delete'}
                      </Button>
                    </>
                  )}
                </CardActions>
              </Card>
              </DraggableCard>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{editor?.fileName}</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            size="small"
            label="Folder"
            value={editor?.folder ?? ''}
            onChange={(event) =>
              setEditor((prev) =>
                prev ? { ...prev, folder: event.target.value } : prev,
              )
            }
            sx={{ mt: 1 }}
            helperText={
              folderNames.length
                ? `Existing: ${folderNames.join(', ')}`
                : undefined
            }
          />
          <TextField
            size="small"
            label="Tags"
            value={editor?.tags ?? ''}
            onChange={(event) =>
              setEditor((prev) =>
                prev ? { ...prev, tags: event.target.value } : prev,
              )
            }
            helperText="Comma-separated, e.g. hero, product"
          />
          <TextField
            size="small"
            label="Alt text"
            value={editor?.alt ?? ''}
            onChange={(event) =>
              setEditor((prev) =>
                prev ? { ...prev, alt: event.target.value } : prev,
              )
            }
          />
          <TextField
            size="small"
            label="Description"
            value={editor?.description ?? ''}
            onChange={(event) =>
              setEditor((prev) =>
                prev ? { ...prev, description: event.target.value } : prev,
              )
            }
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditor(null)}>{'Cancel'}</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleEditorSave}
          >
            {'Save'}
          </Button>
        </DialogActions>
      </Dialog>
        </Stack>
      </Stack>
    </DndContext>
  )
}
MediaLibraryComponent.displayName = 'MediaLibraryComponent'

export default MediaLibraryComponent
