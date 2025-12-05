import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'
import type { Reading } from '../types/models'
import { getGlobalTariff, getMinimumPrice } from './settings'
import { getFlatByFlatId } from './flats'

const getYearMonth = (timestamp: number) => {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export async function uploadMeterImage(_flatId: string, file: File): Promise<string> {
  // Storage-free implementation: read the file as a data URL and store that string in Firestore.
  // This keeps everything on the free Firestore plan and avoids Cloud Storage entirely.
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read file'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export async function createReadingFromImage(
  flatId: string,
  imageUrl: string,
  ocrReading: number | null,
  ocrConfidence?: number | null,
): Promise<void> {
  const readingsRef = collection(db, 'readings')
  const now = Date.now()
  const yearMonth = getYearMonth(now)

  // NOTE: Monthly upload limit temporarily disabled to allow testing
  // of previous-reading / initial-reading logic. Re-introduce the
  // per-month guard here when enforcing limits again.

  await addDoc(readingsRef, {
    flatId,
    imageUrl,
    ocrReading,
    ocrConfidence: ocrConfidence ?? null,
    correctedReading: null,
    previousReading: null,
    unitsUsed: null,
    amount: null,
    status: 'pending',
    createdAt: now,
    yearMonth,
  })
}

export async function getTenantReadings(flatId: string): Promise<Reading[]> {
  const readingsRef = collection(db, 'readings')
  // Avoid Firestore composite index requirement by only filtering,
  // then sort by createdAt on the client.
  const q = query(readingsRef, where('flatId', '==', flatId))
  const snapshot = await getDocs(q)
  const list = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reading, 'id'>) }))
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function getPendingReadings(): Promise<Reading[]> {
  const readingsRef = collection(db, 'readings')
  const q = query(readingsRef, where('status', '==', 'pending'))
  const snapshot = await getDocs(q)
  const list = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reading, 'id'>) }))
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function getApprovedReadings(flatId?: string): Promise<Reading[]> {
  const readingsRef = collection(db, 'readings')
  const constraints = [where('status', '==', 'approved')]
  if (flatId) {
    constraints.push(where('flatId', '==', flatId))
  }
  const q = query(readingsRef, ...constraints)
  const snapshot = await getDocs(q)
  const list = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reading, 'id'>) }))
  // Sort by approvedAt (fallback to createdAt) on the client.
  return list.sort(
    (a, b) => (b.approvedAt || b.createdAt || 0) - (a.approvedAt || a.createdAt || 0),
  )
}

export async function getRejectedReadings(flatId?: string): Promise<Reading[]> {
  const readingsRef = collection(db, 'readings')
  const constraints = [where('status', '==', 'rejected')]
  if (flatId) {
    constraints.push(where('flatId', '==', flatId))
  }
  const q = query(readingsRef, ...constraints)
  const snapshot = await getDocs(q)
  const list = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reading, 'id'>) }))
  return list.sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
  )
}

export function subscribeToPendingReadings(
  callback: (readings: Reading[]) => void,
): () => void {
  const readingsRef = collection(db, 'readings')
  const q = query(readingsRef, where('status', '==', 'pending'))
  
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reading, 'id'>) }))
    const sorted = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    callback(sorted)
  })
}

export function subscribeToApprovedReadings(
  callback: (readings: Reading[]) => void,
  flatId?: string,
): () => void {
  const readingsRef = collection(db, 'readings')
  const constraints = [where('status', '==', 'approved')]
  if (flatId) {
    constraints.push(where('flatId', '==', flatId))
  }
  const q = query(readingsRef, ...constraints)
  
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reading, 'id'>) }))
    const sorted = list.sort(
      (a, b) => (b.approvedAt || b.createdAt || 0) - (a.approvedAt || a.createdAt || 0),
    )
    callback(sorted)
  })
}

export function subscribeToRejectedReadings(
  callback: (readings: Reading[]) => void,
  flatId?: string,
): () => void {
  const readingsRef = collection(db, 'readings')
  const constraints = [where('status', '==', 'rejected')]
  if (flatId) {
    constraints.push(where('flatId', '==', flatId))
  }
  const q = query(readingsRef, ...constraints)
  
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reading, 'id'>) }))
    const sorted = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    callback(sorted)
  })
}

export async function approveReading(readingId: string, correctedReading: number) {
  const readingRef = doc(db, 'readings', readingId)
  const snap = await getDoc(readingRef)
  if (!snap.exists()) throw new Error('Reading not found')
  const reading = snap.data() as Reading

  const tariffPerUnit = await getGlobalTariff()
  const minimumPrice = await getMinimumPrice()

  // First, try to find the most recent approved reading for this flat
  // Exclude the current reading being approved
  const prevQuery = query(
    collection(db, 'readings'),
    where('flatId', '==', reading.flatId),
    where('status', '==', 'approved'),
  )
  const prevSnap = await getDocs(prevQuery)
  const prevList = prevSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Reading, 'id'>) }))
    .filter((r) => r.id !== readingId) // Exclude the current reading being approved
  const prev = prevList.sort(
    (a, b) => (b.approvedAt || b.createdAt || 0) - (a.approvedAt || a.createdAt || 0),
  )[0]
  
  // If no previous approved reading exists, check for initial reading in flat settings
  let previousReading: number | null = null
  if (prev) {
    // Use correctedReading if available, otherwise fall back to ocrReading
    previousReading = prev.correctedReading ?? prev.ocrReading ?? null
  }
  
  // If still no previous reading found, check for initial reading in flat settings
  if (previousReading === null) {
    const flat = await getFlatByFlatId(reading.flatId)
    previousReading = flat?.initialReading ?? null
  }
  
  // Default to 0 if no previous reading found at all
  const finalPreviousReading = previousReading ?? 0

  const rawUnits = correctedReading - finalPreviousReading
  const unitsUsed = rawUnits > 0 ? rawUnits : 0
  let amount = unitsUsed * tariffPerUnit
  if (amount < minimumPrice) {
    amount = minimumPrice
  }
  const approvedAt = Date.now()

  await updateDoc(readingRef, {
    correctedReading,
    previousReading: finalPreviousReading,
    unitsUsed,
    amount,
    status: 'approved',
    approvedAt,
    // Freeze the tariff used for this bill so later tariff changes do not
    // alter historical amounts.
    tariffAtApproval: tariffPerUnit,
  })
}

export async function rejectReading(readingId: string, reason?: string) {
  const readingRef = doc(db, 'readings', readingId)
  await updateDoc(readingRef, {
    status: 'rejected',
    rejectionReason: reason ?? null,
  })
}

export async function reopenReading(readingId: string, reason?: string) {
  const readingRef = doc(db, 'readings', readingId)
  await updateDoc(readingRef, {
    status: 'pending',
    rejectionReason: null,
    reopenReason: reason ?? null,
    unitsUsed: null,
    amount: null,
    approvedAt: null,
    tariffAtApproval: null,
  })
}

