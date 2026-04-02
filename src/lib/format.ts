import { CHUNK_SIZE, PLUR_PER_BZZ } from "./constants"

export function formatExpiry(date: Date | undefined, isExpired: boolean): string {
    if (isExpired) return 'Expired'
    if (!date) return 'Unknown'
    return date.toLocaleString()
}

export function formatBzz(plur: bigint): string {
    const whole = plur / PLUR_PER_BZZ
    const remainder = plur % PLUR_PER_BZZ
    if (remainder === 0n) return whole.toString()
    const decimals = remainder.toString().padStart(16, '0')
    const firstNonZero = decimals.search(/[1-9]/)
    const places = firstNonZero + 2
    const raw = Number(`${whole}.${decimals}`)
    return raw.toFixed(places)
}


export function formatStorageCapacity(depth: number): string {
    const chunks = 2 ** depth
    const bytes = chunks * CHUNK_SIZE
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

