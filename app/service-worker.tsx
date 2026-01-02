/// <reference lib="webworker" />

const _CACHE_NAME = "school-ms-v1"
const STATIC_CACHE = "school-ms-static-v1"
const DYNAMIC_CACHE = "school-ms-dynamic-v1"

const STATIC_ASSETS = ["/", "/auth/login", "/dashboard", "/offline"]

const sw = self as unknown as ServiceWorkerGlobalScope

// Install event - cache static assets
sw.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Caching static assets")
      return cache.addAll(STATIC_ASSETS)
    }),
  )
  sw.skipWaiting()
})

// Activate event - clean up old caches
sw.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE).map((name) => caches.delete(name)),
      )
    }),
  )
  sw.clients.claim()
})

// Fetch event - network first, fallback to cache
sw.addEventListener("fetch", (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip API requests for online-only operations
  if (request.url.includes("/api/")) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response for caching
        const responseClone = response.clone()

        // Cache successful responses
        if (response.status === 200) {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
        }

        return response
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // If no cache, return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/offline")
          }

          // Return a basic offline response
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          })
        })
      }),
  )
})

// Background sync for marks entry
sw.addEventListener("sync", (event) => {
  if (event.tag === "sync-marks") {
    event.waitUntil(syncMarks())
  }
})

async function syncMarks() {
  // Get pending marks from IndexedDB
  const db = await openMarksSyncDB()
  const pendingMarks = await getPendingMarks(db)

  for (const mark of pendingMarks) {
    try {
      const response = await fetch("/api/marks/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mark),
      })

      if (response.ok) {
        await removePendingMark(db, mark.id)
      }
    } catch (error) {
      console.error("[SW] Failed to sync mark:", error)
    }
  }
}

async function openMarksSyncDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("MarksSync", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains("pendingMarks")) {
        db.createObjectStore("pendingMarks", { keyPath: "id", autoIncrement: true })
      }
    }
  })
}

interface PendingMark {
  id: number
  student_id: string
  exam_id: string
  subject_id: string
  score: number
  grade: string
}

async function getPendingMarks(db: IDBDatabase): Promise<PendingMark[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("pendingMarks", "readonly")
    const store = transaction.objectStore("pendingMarks")
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function removePendingMark(db: IDBDatabase, id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("pendingMarks", "readwrite")
    const store = transaction.objectStore("pendingMarks")
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
