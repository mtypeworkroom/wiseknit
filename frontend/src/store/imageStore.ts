const DB_NAME = 'wiseknit'
const VERSION = 3
const IMAGE_STORE = 'chart-images'
const PDF_STORE = 'pdfs'

let _db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE)
      }
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        db.createObjectStore(PDF_STORE)
      }
    }
    req.onsuccess = () => {
      _db = req.result
      _db.onclose = () => { _db = null }
      resolve(req.result)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function saveImage(key: string, base64: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, 'readwrite')
    tx.objectStore(IMAGE_STORE).put(base64, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadImage(key: string): Promise<string | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(IMAGE_STORE, 'readonly')
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(new Error('IDB transaction aborted'))
      const req = tx.objectStore(IMAGE_STORE).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function deleteImage(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, 'readwrite')
    tx.objectStore(IMAGE_STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function savePDF(key: string, data: ArrayBuffer): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PDF_STORE, 'readwrite')
    tx.objectStore(PDF_STORE).put(data, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadPDF(key: string): Promise<ArrayBuffer | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(PDF_STORE, 'readonly')
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(new Error('IDB transaction aborted'))
      const req = tx.objectStore(PDF_STORE).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export async function deletePDF(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PDF_STORE, 'readwrite')
    tx.objectStore(PDF_STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
