export function giftLockKey(reference: string): string {
    return `gift:lock:${reference}`;
}


export function giftCountKey(eventId: string): string {
    return `event:${eventId}:gift_count`;
}