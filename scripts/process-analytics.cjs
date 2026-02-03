const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const csvFilePath = path.join(__dirname, '../wsqk_the_squawk_listeners_2026-01-01_00-00-00_to_2026-01-31_23-59-59 (1).csv');
const outputFilePath = path.join(__dirname, '../src/data/analytics-jan-2026.json');

// Ensure output directory exists
const outputDir = path.dirname(outputFilePath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Reading CSV file...');
const input = fs.readFileSync(csvFilePath);

console.log('Parsing CSV data...');
const records = parse(input, {
    columns: true,
    skip_empty_lines: true
});

console.log(`Total records found: ${records.length}`);

const dailyHits = {};
const weeklyHits = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; // 5 potential weeks in a month
const countryStats = {};
const deviceStats = {};
const hoursStats = new Array(24).fill(0);
let totalDurationSeconds = 0;
let mobileCount = 0;
let desktopCount = 0;

records.forEach(record => {
    // 1. Daily Hits & Peak Hours processing
    // Format: 2026-01-03T22:20:24-08:00
    const startTime = record['Start Time'];
    if (startTime) {
        // Date aggregation
        const date = startTime.split('T')[0];
        dailyHits[date] = (dailyHits[date] || 0) + 1;

        // Weekly aggregation (Simple logic: Day 1-7 = Week 1, etc.)
        const dayOfMonth = parseInt(date.split('-')[2], 10);
        const weekNum = Math.ceil(dayOfMonth / 7);
        if (weekNum <= 5) {
            weeklyHits[weekNum]++;
        }

        // Hour aggregation (Peak times)
        // Extract hour from T22:20:24
        const hour = parseInt(startTime.split('T')[1].split(':')[0], 10);
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
            hoursStats[hour]++;
        }
    }

    // 2. Country Stats
    const country = record['Location: Country'];
    if (country) {
        countryStats[country] = (countryStats[country] || 0) + 1;
    }

    // 3. Device Stats (Browser Family or OS)
    const device = record['Device: OS Family']; // e.g., Android, Windows
    if (device) {
        deviceStats[device] = (deviceStats[device] || 0) + 1;
    }

    // Platform Stats (Mobile vs Desktop)
    const isMobile = record['Device: Is Mobile'] === 'True';
    if (isMobile) {
        mobileCount++;
    } else {
        desktopCount++;
    }

    // 4. Duration
    const duration = parseInt(record['Seconds Connected'], 10);
    if (!isNaN(duration)) {
        totalDurationSeconds += duration;
    }
});

// Convert to Arrays for Recharts and sorting
// Fix: We want to ensure we have all days from Jan 1 to Jan 31 even if 0 hits
const startDate = new Date('2026-01-01');
const endDate = new Date('2026-01-31');
const dailyDataMap = { ...dailyHits };
const finalDailyData = [];

for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayStr = d.toISOString().split('T')[0];
    finalDailyData.push({
        date: dayStr,
        hits: dailyDataMap[dayStr] || 0
    });
}

const topCountries = Object.entries(countryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Top 10
    .map(([code, count]) => ({ code, count }));

const topDevices = Object.entries(deviceStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

const peakHours = hoursStats.map((count, hour) => ({
    hour: `${hour}:00`,
    count
}));

const weeklyData = Object.entries(weeklyHits).map(([week, count]) => ({
    name: `Week ${week}`,
    count
}));

const analyticsData = {
    generatedAt: new Date().toISOString(),
    totalSessions: records.length,
    totalHours: Math.round(totalDurationSeconds / 3600),
    avgSessionSeconds: Math.round(totalDurationSeconds / records.length),
    platformSplit: { mobile: mobileCount, desktop: desktopCount },
    dailyHits: finalDailyData,
    weeklyHits: weeklyData,
    peakHours: peakHours,
    topCountries: topCountries,
    topDevices: topDevices
};

fs.writeFileSync(outputFilePath, JSON.stringify(analyticsData, null, 2));

console.log('Analytics data processed successfully!');
console.log(`- Saved to: ${outputFilePath}`);
console.log(`- Days tracked: ${finalDailyData.length}`);
console.log(`- Top Country: ${topCountries[0]?.code} (${topCountries[0]?.count})`);
console.log(`- Total Sessions: ${records.length}`);
