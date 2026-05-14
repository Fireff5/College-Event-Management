export interface Admin {
    id: number;
    username: string;
}

export interface Participant {
    id: string; // Auto-generated e.g., SP1234
    name: string;
    email: string;
    phone: string;
    department: string;
    year: number;
    institute?: string;
    registered_events?: number[];
}

export type EventCategory = 'Track' | 'Field' | 'Swimming' | 'Team Sport' | 'School Events';

export interface Event {
    id: number;
    name: string;
    category: EventCategory;
    date: string; // ISO Date string
    venue: string;
    max_participants: number;
}

export interface Result {
    id: number;
    event_id: number;
    participant_id: string;
    position: 1 | 2 | 3;
    remarks: string;
    document_url?: string;
    // Expanded fields for frontend convenience
    participant?: Participant;
    event?: Event;
}

export interface DashboardStats {
    totalParticipants: number;
    totalEvents: number;
    totalResults: number;
}

export interface School {
    id: string;           // e.g. "SCH001"
    name: string;
    email: string;
    phone: string;
    address: string;
    username: string;     // auto-generated
    password: string;     // plain-text for mock
    createdAt: string;    // ISO string
    registeredEvents?: number[];  // event IDs selected at registration
    studentNames?: string[];      // legacy flat list (kept for backward compat)
    studentsByEvent?: Record<number, string[]>; // per-event student names
}

export interface AdminMessage {
    id: number;
    schoolId: string;
    subject: string;
    body: string;
    sentAt: string;       // ISO string
}
