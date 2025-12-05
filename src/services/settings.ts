import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const SETTINGS_COLLECTION = 'settings'
const GLOBAL_TARIFF_DOC = 'globalTariff'

type GlobalTariffDoc = {
  tariffPerUnit: number
  minimumPrice?: number
}

export async function getGlobalTariff(): Promise<number> {
  const ref = doc(db, SETTINGS_COLLECTION, GLOBAL_TARIFF_DOC)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    // Default to 0 if not configured yet; admin can set this in the dashboard.
    return 0
  }
  const data = snap.data() as Partial<GlobalTariffDoc>
  return typeof data.tariffPerUnit === 'number' ? data.tariffPerUnit : 0
}

export async function getMinimumPrice(): Promise<number> {
  const ref = doc(db, SETTINGS_COLLECTION, GLOBAL_TARIFF_DOC)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    // Default to 250 if not configured yet.
    return 250
  }
  const data = snap.data() as Partial<GlobalTariffDoc>
  return typeof data.minimumPrice === 'number' ? data.minimumPrice : 250
}

export async function updateGlobalTariff(tariffPerUnit: number): Promise<void> {
  const ref = doc(db, SETTINGS_COLLECTION, GLOBAL_TARIFF_DOC)
  await setDoc(
    ref,
    {
      tariffPerUnit,
    },
    { merge: true },
  )
}

export async function updateMinimumPrice(minimumPrice: number): Promise<void> {
  const ref = doc(db, SETTINGS_COLLECTION, GLOBAL_TARIFF_DOC)
  await setDoc(
    ref,
    {
      minimumPrice,
    },
    { merge: true },
  )
}


