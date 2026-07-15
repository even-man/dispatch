type Incident = {
    address: string,
    callType: string,
    city: string,
    timestamp: string,
    lat: number,
    lon: number 
}

type Filters = {
    filter: string
    callTypes: string[]
}

export type { Incident, Filters }