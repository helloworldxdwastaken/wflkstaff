// Timezone list with UTC offsets
// Note: Some offsets vary with DST, showing standard time offset
export const TIMEZONES = [
    { value: "UTC", label: "UTC", offset: "+0" },
    { value: "Pacific/Honolulu", label: "Hawaii", offset: "-10" },
    { value: "America/Anchorage", label: "Alaska", offset: "-9" },
    { value: "America/Los_Angeles", label: "Los Angeles", offset: "-8" },
    { value: "America/Denver", label: "Denver", offset: "-7" },
    { value: "America/Chicago", label: "Chicago", offset: "-6" },
    { value: "America/New_York", label: "New York", offset: "-5" },
    { value: "America/Sao_Paulo", label: "São Paulo", offset: "-3" },
    { value: "Europe/London", label: "London", offset: "+0" },
    { value: "Europe/Paris", label: "Paris", offset: "+1" },
    { value: "Europe/Berlin", label: "Berlin", offset: "+1" },
    { value: "Europe/Kiev", label: "Kyiv", offset: "+2" },
    { value: "Asia/Jerusalem", label: "Tel Aviv", offset: "+2" },
    { value: "Europe/Moscow", label: "Moscow", offset: "+3" },
    { value: "Asia/Dubai", label: "Dubai", offset: "+4" },
    { value: "Asia/Kolkata", label: "Mumbai", offset: "+5:30" },
    { value: "Asia/Bangkok", label: "Bangkok", offset: "+7" },
    { value: "Asia/Singapore", label: "Singapore", offset: "+8" },
    { value: "Asia/Shanghai", label: "Shanghai", offset: "+8" },
    { value: "Asia/Tokyo", label: "Tokyo", offset: "+9" },
    { value: "Asia/Seoul", label: "Seoul", offset: "+9" },
    { value: "Australia/Sydney", label: "Sydney", offset: "+11" },
    { value: "Pacific/Auckland", label: "Auckland", offset: "+13" },
] as const

export type TimezoneValue = typeof TIMEZONES[number]['value']
