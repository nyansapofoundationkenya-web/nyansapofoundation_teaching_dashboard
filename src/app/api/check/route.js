// app/api/check/route.js
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function GET() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const client = new BetaAnalyticsDataClient({ credentials });

    const [response] = await client.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{
        startDate: '30daysAgo',
        endDate: 'today',
      }],
      dimensions: [
        { name: 'signedInWithUserId' },
      ],
      metrics: [
        { name: 'activeUsers' },
      ],
    });

    const users = response.rows?.map(row => ({
      signedIn: row.dimensionValues[0].value,
      count: row.metricValues[0].value,
    })) || [];

    console.log('Signed in status:', users);

    return Response.json({ 
      success: true,
      users,
      message: users.some(u => u.signedIn === 'yes') 
        ? 'Some users are signed in!' 
        : 'No signed-in users detected'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}