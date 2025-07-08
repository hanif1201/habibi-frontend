# Progressive Expiration Warnings

## Overview

The Progressive Expiration Warnings feature provides users with timely notifications about matches that are about to expire. Instead of a single warning, users receive multiple notifications at different intervals, with increasing urgency as the expiration time approaches.

## Features

### 1. Multiple Warning Intervals

- **24 Hours Before**: Gentle reminder when match expires tomorrow
- **12 Hours Before**: Early warning when match expires soon
- **6 Hours Before**: Urgent reminder when match expires today
- **2 Hours Before**: Critical warning when match expires soon
- **1 Hour Before**: Final warning when match expires

### 2. Progressive Urgency

Each warning level has:

- **Different Icons**: ⏰ → ⚠️ → 🚨 → 🔥 → 💥
- **Different Colors**: Blue → Yellow → Orange → Red → Dark Red
- **Different Vibration Patterns**: Increasing intensity
- **Different Interaction Requirements**: Some require user interaction

### 3. Smart Tracking

- **Duplicate Prevention**: Each warning is only sent once per match
- **Persistent History**: Warning history stored in localStorage
- **Automatic Cleanup**: Old warnings cleaned up after 72 hours
- **Real-time Monitoring**: Checks for expiring matches every minute

## Implementation

### Frontend Components

#### 1. Service Worker (`public/sw.js`)

Handles push notifications for different expiration warning types:

```javascript
case "match_expiring_24h":
  notificationData.title = "⏰ Match Expires Tomorrow";
  notificationData.body = `Your match with ${notificationData.userName} expires in 24 hours. Send a message to keep the connection!`;
  break;
```

#### 2. Notification Service (`src/services/NotificationService.js`)

Enhanced with progressive warning handling:

```javascript
async handleMatchExpirationWarning(matchData, hoursLeft, warningType) {
  const notificationConfig = this.getExpirationWarningConfig(hoursLeft, warningType, matchData);
  // Show notification with appropriate urgency
}
```

#### 3. Expiration Warnings Hook (`src/hooks/useExpirationWarnings.js`)

Manages the logic for detecting and sending warnings:

```javascript
const checkExpiringMatches = useCallback(() => {
  // Check matches at different intervals
  const warningIntervals = [24, 12, 6, 2, 1];
  // Send warnings if not already sent
}, [matches, warningHistory]);
```

#### 4. UI Components

- **MatchesList**: Enhanced with detailed expiration status and visual indicators
- **ExpiringMatchesAlert**: Prominent dashboard alert for urgent expiring matches
- **NotificationSettings**: User preferences for each warning type
- **NotificationCenter**: Displays different warning types with appropriate styling

### User Preferences

Users can control which warnings they receive:

```javascript
const preferences = {
  expiring24h: true, // 24 hours before
  expiring12h: true, // 12 hours before
  expiring6h: true, // 6 hours before
  expiring2h: true, // 2 hours before
  expiring1h: true, // 1 hour before
};
```

### Visual Indicators

#### Match Status Colors

- **Green**: New match (< 24h)
- **Yellow**: Pending (24-48h left)
- **Orange**: Expiring soon (12-24h left)
- **Red**: Urgent (6-12h left)
- **Dark Red**: Critical (1-6h left)
- **Pulsing Red**: Final warning (< 1h left)

#### Dashboard Alert

Prominent alert on dashboard showing:

- Most urgent expiring match
- Count of all expiring matches
- Quick action to view matches

## Testing

### Debug Component

A test component is available in development mode:

```javascript
// Test individual warning types
await notificationService.handleMatchExpirationWarning(
  mockMatchData,
  hoursLeft,
  warningType
);
```

### Test Features

- Test all warning types at once
- Individual warning type testing
- Visual feedback for test results
- Warning type overview

## Backend Integration

The frontend expects the backend to:

1. **Track Warning History**: Store which warnings have been sent
2. **Hourly Cron Job**: Check for matches at different intervals
3. **Push Notifications**: Send push notifications for critical warnings (2h, 1h)
4. **Email Notifications**: Send email warnings for all intervals
5. **Preference Management**: Store user preferences for each warning type

### Expected API Endpoints

```javascript
// Get matches with expiration info
GET / api / matching / matches;

// Update notification preferences
PUT / api / notifications / preferences;

// Send push notification
POST / api / notifications / push;

// Send email notification
POST / api / notifications / email;
```

## User Experience

### Progressive Engagement

1. **24h Warning**: Gentle reminder to start conversation
2. **12h Warning**: Early warning with more urgency
3. **6h Warning**: Urgent reminder requiring interaction
4. **2h Warning**: Critical warning with vibration
5. **1h Warning**: Final warning with intense vibration

### Visual Feedback

- **Status Badges**: Color-coded urgency levels
- **Countdown Display**: Real-time hours remaining
- **Dashboard Alerts**: Prominent warnings for urgent cases
- **Notification Center**: Organized by urgency level

### Accessibility

- **Vibration Patterns**: Different patterns for different urgency levels
- **Visual Indicators**: Color and icon changes
- **Sound Alerts**: Audio notifications for critical warnings
- **Screen Reader Support**: Proper ARIA labels and descriptions

## Configuration

### Environment Variables

```javascript
// Enable/disable progressive warnings
ENABLE_PROGRESSIVE_EXPIRATION_WARNINGS = true;

// Warning intervals (in hours)
EXPIRATION_WARNING_INTERVALS = [24, 12, 6, 2, 1];

// Match expiration time (in hours)
MATCH_EXPIRATION_HOURS = 72;
```

### Customization

- Warning intervals can be adjusted
- Colors and icons can be customized
- Vibration patterns can be modified
- Notification text can be localized

## Future Enhancements

1. **Smart Timing**: Send warnings at optimal times for user engagement
2. **A/B Testing**: Test different warning messages and timing
3. **Analytics**: Track warning effectiveness and user response
4. **Personalization**: Adjust warning frequency based on user behavior
5. **Integration**: Connect with chat system for quick reply actions

## Troubleshooting

### Common Issues

1. **Warnings Not Showing**: Check notification permissions
2. **Duplicate Warnings**: Verify warning history tracking
3. **Incorrect Timing**: Check timezone settings
4. **Missing Alerts**: Ensure dashboard integration is working

### Debug Tools

- Use the debug panel in development mode
- Check browser console for errors
- Verify localStorage warning history
- Test individual warning types

## Security Considerations

- **User Consent**: All warnings require user permission
- **Data Privacy**: Warning history stored locally
- **Rate Limiting**: Prevent spam notifications
- **Preference Control**: Users can disable any warning type
