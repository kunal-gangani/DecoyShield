const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function getEvents() {
    try {
        const res = await fetch(`${API_URL}/events/`)
        if (!res.ok) return []
        return res.json()
    } catch {
        return []
    }
}

export async function getHoneypots() {
    try {
        const res = await fetch(`${API_URL}/honeypots/`)
        if (!res.ok) return []
        return res.json()
    } catch {
        return []
    }
}

export async function getStats() {
    try {
        const res = await fetch(`${API_URL}/reports/stats`)
        if (!res.ok) return { total_events: 0, high_risk_events: 0, unique_countries: [] }
        return res.json()
    } catch {
        return { total_events: 0, high_risk_events: 0, unique_countries: [] }
    }
}

export async function createEvent(data: object) {
    try {
        const res = await fetch(`${API_URL}/events/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        return res.json()
    } catch {
        return null
    }
}