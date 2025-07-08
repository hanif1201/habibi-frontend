# Email Integration Documentation

## Overview

The Habibi frontend now includes comprehensive email notification functionality for immediate new match alerts. This implementation ensures that users receive email notifications when they get a new match, while maintaining a smooth user experience.

## Features Implemented

### 1. Email Service (`src/services/EmailService.js`)

- **New Match Email Notifications**: Automatically sends emails when matches are created
- **Email Preferences Management**: Handles user email preference settings
- **Error Handling**: Non-blocking email sending to prevent match flow interruption
- **Test Email Functionality**: Allows testing of email templates

### 2. Integration Points

#### CardStack Component (`src/components/Matching/CardStack.js`)

- Triggers email notifications when new matches are created
- Integrates with both notification service and email service
- Non-blocking implementation ensures smooth user experience

#### MatchModal Component (`src/components/Matching/MatchModal.js`)

- Secondary trigger point for email notifications
- Ensures emails are sent even if user views match modal directly

#### EmailPreferences Component (`src/components/Settings/EmailPreferences.js`)

- Updated to use the new EmailService
- Includes test email functionality
- Comprehensive preference management

### 3. Notification Service Integration

- Enhanced `NotificationService.js` with new match handling
- Coordinated push notifications and email notifications
- Maintains separation of concerns

## API Endpoints Used

The frontend expects the following backend endpoints:

### Email Endpoints

- `POST /api/email/new-match` - Send new match email
- `POST /api/email/test` - Send test email
- `GET /api/auth/email-preferences` - Get user email preferences
- `PUT /api/auth/email-preferences` - Update email preferences

### Authentication Endpoints

- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot-password` - Send password reset email

## Email Preferences

Users can control the following email notifications:

### Dating Activity

- **Weekly Match Summary**: Weekly statistics and activity reports
- **New Match Alerts**: Immediate notifications for new matches
- **New Message Alerts**: Email notifications for new messages
- **Like Notifications**: Notifications when someone likes your profile
- **Super Like Notifications**: Notifications for super likes

### Content & Tips

- **Dating Tips & Advice**: Weekly dating advice and tips
- **Event Updates**: Information about local dating events

### Marketing & Promotions

- **Marketing Emails**: Promotional content and feature updates
- **Partner Offers**: Special deals from trusted partners

## Error Handling

### Non-Critical Email Failures

- Email sending failures do not interrupt the match creation flow
- Errors are logged but don't affect user experience
- Graceful degradation ensures core functionality remains intact

### Preference Fallbacks

- Default preferences are used if API calls fail
- New match emails default to enabled if preferences can't be loaded
- User experience is prioritized over perfect error handling

## Testing

### Debug Panel

A debug panel is available in development mode (`NODE_ENV === "development"`) that includes:

- **Test New Match Email**: Send a test new match email
- **Test Email Preferences**: Load and display current preferences
- **Test Notification Service**: Test local notification functionality
- **Test Local Notification**: Send a test browser notification

### Manual Testing

1. Navigate to the Dashboard
2. Go to Email Settings (Quick Actions → Email Settings)
3. Use the "Send Test Email" button to test email functionality
4. Check browser console for detailed logs

## Implementation Details

### Email Service Architecture

```javascript
// Singleton pattern for consistent service access
const emailService = new EmailService();

// Non-blocking email sending
emailService.sendNewMatchEmail(matchData).catch((error) => {
  console.warn("Email notification failed (non-critical):", error);
});
```

### Preference Checking

```javascript
// Check if user wants new match emails
const shouldSendEmail = await emailService.shouldSendNewMatchEmail();
if (shouldSendEmail) {
  // Send email in background
  emailService.sendNewMatchEmail(matchData);
}
```

### Integration with Match Flow

```javascript
// In CardStack.js - when match is created
if (response.data.isMatch) {
  const matchData = response.data.match;
  setMatch(matchData);
  setShowMatchModal(true);

  // Send notifications (non-blocking)
  try {
    await notificationService.handleNewMatch(matchData);

    const shouldSendEmail = await emailService.shouldSendNewMatchEmail();
    if (shouldSendEmail) {
      emailService.sendNewMatchEmail(matchData).catch((error) => {
        console.warn("Email notification failed (non-critical):", error);
      });
    }
  } catch (error) {
    console.warn("Failed to send match notifications:", error);
    // Continue with match flow even if notifications fail
  }
}
```

## Backend Requirements

The backend should implement:

1. **Email Template System**: HTML templates for new match emails
2. **SMTP Configuration**: Proper email service setup
3. **Email Queue System**: Reliable email delivery
4. **Preference Storage**: User email preference management
5. **Error Handling**: Graceful email sending failures

## Security Considerations

- Email preferences are user-controlled
- No sensitive data in email content
- Proper authentication for all email endpoints
- Rate limiting for email sending
- GDPR compliance for email preferences

## Future Enhancements

1. **Email Templates**: Rich HTML templates with user photos
2. **Email Analytics**: Track email open rates and engagement
3. **Smart Timing**: Send emails at optimal times for user engagement
4. **A/B Testing**: Test different email content and timing
5. **Unsubscribe Management**: Easy unsubscribe links and preferences

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check backend email configuration
2. **Preferences not loading**: Verify API endpoint availability
3. **Test emails failing**: Ensure backend test endpoint is working
4. **Console errors**: Check network tab for API call failures

### Debug Steps

1. Open browser developer tools
2. Check Console tab for error messages
3. Check Network tab for failed API calls
4. Use Debug panel to test individual components
5. Verify backend email service is running

## Dependencies

- No additional frontend dependencies required
- Uses existing axios for HTTP requests
- Integrates with existing notification system
- Compatible with current authentication flow
