# Analytics API Contract

This document defines the backend API required by the Nexus FMS Analytics page.

The analytics API should be exposed under the `/analytics` namespace. The frontend can either consume one aggregated endpoint or request the individual resources below. The recommended approach is one aggregated endpoint because the Analytics page loads all dashboard sections together.

## Recommended endpoint

```http
GET /analytics
```

### Query parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `start_date` | `date` | No | Start of the reporting period, inclusive. Format: `YYYY-MM-DD`. |
| `end_date` | `date` | No | End of the reporting period, inclusive. Format: `YYYY-MM-DD`. |
| `period` | `string` | No | Preset period: `7d`, `30d`, `6m`, `12m`. Default: `6m`. |
| `futsal` | `uuid` | No | Filter analytics for a specific facility. |
| `timezone` | `string` | No | Timezone used for date grouping. Example: `Asia/Kathmandu`. |

Example:

```http
GET /analytics?period=6m&timezone=Asia%2FKathmandu
```

## Expected response

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "period": {
      "start_date": "2026-04-01",
      "end_date": "2026-09-05",
      "timezone": "Asia/Kathmandu"
    },
    "summary": {
      "total_revenue": "2847500.00",
      "total_bookings": 1284,
      "average_booking_value": "2218.30",
      "active_customers": 864,
      "revenue_change_percent": 18.6,
      "bookings_change_percent": 12.4,
      "average_booking_value_change_percent": 6.8,
      "active_customers_change_percent": 9.2
    },
    "revenue_overview": [
      {
        "period": "2026-04",
        "label": "Apr",
        "revenue": "384000.00",
        "booking_count": 174
      },
      {
        "period": "2026-05",
        "label": "May",
        "revenue": "421500.00",
        "booking_count": 191
      }
    ],
    "booking_status": {
      "total": 1284,
      "breakdown": [
        {
          "status": "CONFIRMED",
          "label": "Confirmed",
          "count": 744,
          "percentage": 58
        },
        {
          "status": "COMPLETED",
          "label": "Completed",
          "count": 347,
          "percentage": 27
        },
        {
          "status": "CANCELLED",
          "label": "Cancelled",
          "count": 128,
          "percentage": 10
        },
        {
          "status": "PENDING",
          "label": "Pending",
          "count": 65,
          "percentage": 5
        }
      ]
    },
    "bookings_by_day": [
      {
        "day": "MONDAY",
        "label": "Mon",
        "booking_count": 42
      },
      {
        "day": "TUESDAY",
        "label": "Tue",
        "booking_count": 62
      },
      {
        "day": "WEDNESDAY",
        "label": "Wed",
        "booking_count": 51
      },
      {
        "day": "THURSDAY",
        "label": "Thu",
        "booking_count": 78
      },
      {
        "day": "FRIDAY",
        "label": "Fri",
        "booking_count": 68
      },
      {
        "day": "SATURDAY",
        "label": "Sat",
        "booking_count": 91
      },
      {
        "day": "SUNDAY",
        "label": "Sun",
        "booking_count": 74
      }
    ],
    "revenue_by_source": [
      {
        "source": "USER",
        "label": "User bookings",
        "revenue": "1982400.00",
        "booking_count": 902,
        "percentage": 69.6
      },
      {
        "source": "ADMIN",
        "label": "Admin bookings",
        "revenue": "865100.00",
        "booking_count": 382,
        "percentage": 30.4
      }
    ],
    "generated_at": "2026-09-05T12:30:00+05:45"
  }
}
```

## Required data calculations

### Summary cards

The frontend needs the following values:

- `total_revenue`: Sum of booking amounts for the selected period. Use confirmed and completed bookings according to the product's revenue policy.
- `total_bookings`: Count of bookings in the selected period.
- `average_booking_value`: `total_revenue / revenue_booking_count`.
- `active_customers`: Distinct customers with at least one booking in the selected period.
- `*_change_percent`: Percentage change compared with the equivalent previous period.

The backend should return numeric values as numbers where possible. Currency values may be returned as strings to preserve decimal precision.

### Revenue overview

Return one item per reporting period. For a six-month view, return six monthly points. For a daily period such as `7d`, return one item per day.

Required fields:

- `period`: Stable grouping key, such as `2026-09`.
- `label`: Display label, such as `Sep`.
- `revenue`: Revenue total for that period.
- `booking_count`: Number of bookings in that period.

### Booking status

The frontend uses this data for the donut chart. The backend should return every relevant status, including statuses with a count of zero if consistent chart legends are desired.

Recommended statuses:

- `PENDING`
- `CONFIRMED`
- `CANCELLED`
- `COMPLETED`
- `RESCHEDULED`

`percentage` should be calculated against `booking_status.total` and should sum to approximately 100.

### Bookings by day

Aggregate bookings by weekday using the requested timezone. Return all seven days in Monday-to-Sunday order, including zero-value days.

### Revenue by source

The booking source values are:

- `USER`
- `ADMIN`

Return both revenue and booking count so the frontend can show a source comparison and percentages.

## Optional supporting endpoints

If the backend team prefers separate resources instead of one aggregated response, expose these endpoints under `/analytics`:

```http
GET /analytics/summary
GET /analytics/revenue-overview
GET /analytics/booking-status
GET /analytics/bookings-by-day
GET /analytics/revenue-by-source
```

All endpoints should accept the same filtering parameters:

```text
start_date
end_date
period
futsal
timezone
```

The aggregated `GET /analytics` endpoint remains recommended for the current UI.

## Error response

Use a consistent error shape:

```json
{
  "success": false,
  "message": "Invalid date range.",
  "errors": {
    "start_date": ["Start date must be before end date."]
  }
}
```

Recommended HTTP statuses:

- `200`: Successful response
- `400`: Invalid query parameters
- `401`: Unauthenticated
- `403`: User is not allowed to view analytics
- `404`: Facility not found
- `500`: Unexpected server error

## Access and performance requirements

- Require an authenticated admin user.
- Apply the user's facility permissions before calculating results.
- Use the requested timezone for day and month grouping.
- Return consistent decimal precision for revenue values.
- Keep response ordering stable so chart rendering does not jump.
- Consider caching aggregated results for short periods when the reporting range is large.
- Never calculate analytics from frontend dummy data after backend integration; replace the dummy values with `GET /analytics` response data.

## Frontend integration mapping

| UI section | Response path |
|---|---|
| Summary cards | `data.summary` |
| Revenue overview chart | `data.revenue_overview` |
| Booking status donut | `data.booking_status.breakdown` |
| Bookings by day chart | `data.bookings_by_day` |
| Revenue by source | `data.revenue_by_source` |
| Period selector | `data.period` |
