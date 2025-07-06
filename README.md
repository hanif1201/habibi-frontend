# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

# Habibi Dating Platform - Environment Configuration

# Copy this file to .env and fill in your actual values

# ==========================================

# APPLICATION SETTINGS

# ==========================================

NODE_ENV=development
PORT=5000
APP_NAME=Habibi
APP_VERSION=1.0.0

# ==========================================

# DATABASE CONFIGURATION

# ==========================================

# MongoDB connection string

MONGODB_URI=mongodb://localhost:27017/habibi

# Alternative for MongoDB Atlas:

# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/habibi?retryWrites=true&w=majority

# ==========================================

# SECURITY & AUTHENTICATION

# ==========================================

# JWT Secret - Use a strong, random string in production

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Bcrypt salt rounds (10-12 recommended for production)

BCRYPT_SALT_ROUNDS=12

# ==========================================

# CLOUDINARY CONFIGURATION

# ==========================================

# For image upload and storage

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# ==========================================

# FRONTEND CONFIGURATION

# ==========================================

# Frontend URL for CORS

FRONTEND_URL=http://localhost:3000

# Add additional frontend URLs separated by commas

ADDITIONAL_FRONTEND_URLS=http://localhost:3001,https://yourdomain.com

# ==========================================

# EMAIL CONFIGURATION

# ==========================================

# SMTP settings for sending emails

EMAIL_FROM=noreply@habibi.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SECURE=false

# SendGrid API (alternative to SMTP)

SENDGRID_API_KEY=your-sendgrid-api-key

# ==========================================

# REDIS CONFIGURATION

# ==========================================

# For caching and session management

REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# ==========================================

# PUSH NOTIFICATIONS

# ==========================================

# Firebase Cloud Messaging

FCM_SERVER_KEY=your-fcm-server-key
FCM_SENDER_ID=your-fcm-sender-id

# Apple Push Notification Service

APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id
APNS_BUNDLE_ID=com.yourcompany.habibi
APNS_PRIVATE_KEY_PATH=./certs/apns-private-key.p8

# ==========================================

# THIRD-PARTY SERVICES

# ==========================================

# Google Maps API for location services

GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Twilio for SMS verification

TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# AWS S3 (alternative to Cloudinary)

AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=habibi-uploads

# ==========================================

# SOCIAL MEDIA AUTHENTICATION

# ==========================================

# Facebook Login

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Google Login

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple Login

APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key

# ==========================================

# PAYMENT PROCESSING

# ==========================================

# Stripe for premium subscriptions

STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# PayPal (alternative)

PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox

# ==========================================

# ANALYTICS & MONITORING

# ==========================================

# Google Analytics

GA_TRACKING_ID=UA-XXXXXXXXX-X

# Sentry for error tracking

SENTRY_DSN=your-sentry-dsn

# New Relic for performance monitoring

NEW_RELIC_LICENSE_KEY=your-new-relic-license-key

# ==========================================

# RATE LIMITING & SECURITY

# ==========================================

# Rate limiting settings

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# CORS settings

CORS_ORIGIN=\*
CORS_CREDENTIALS=true

# ==========================================

# FEATURE FLAGS

# ==========================================

# Enable/disable features

ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SOCIAL_LOGIN=true
ENABLE_PREMIUM_FEATURES=true
ENABLE_VIDEO_CHAT=false
ENABLE_ANALYTICS=true

# ==========================================

# DEVELOPMENT SETTINGS

# ==========================================

# Debug settings (development only)

DEBUG_MODE=true
LOG_LEVEL=debug
ENABLE_API_DOCS=true

# Mock services for testing

MOCK_PAYMENTS=true
MOCK_SMS=true
MOCK_EMAIL=true

# ==========================================

# PRODUCTION SETTINGS

# ==========================================

# SSL/TLS settings for production

SSL_CERT_PATH=./certs/certificate.crt
SSL_KEY_PATH=./certs/private.key

# Cluster settings

CLUSTER_MODE=false
CLUSTER_WORKERS=auto

# ==========================================

# BACKUP & MAINTENANCE

# ==========================================

# Database backup settings

BACKUP_SCHEDULE=0 2 \* \* \*
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=habibi-backups

# ==========================================

# CONTENT MODERATION

# ==========================================

# AI content moderation service

CONTENT_MODERATION_API_KEY=your-moderation-api-key
ENABLE_AUTO_MODERATION=true

# ==========================================

# GEOLOCATION & MATCHING

# ==========================================

# Default search radius in kilometers

DEFAULT_SEARCH_RADIUS=50
MAX_SEARCH_RADIUS=500

# Matching algorithm settings

MATCHING_ALGORITHM_VERSION=v2
ENABLE_ADVANCED_MATCHING=true

# ==========================================

# CHAT & MESSAGING

# ==========================================

# Message retention period (in days)

MESSAGE_RETENTION_DAYS=365
MAX_MESSAGE_LENGTH=1000
ENABLE_MESSAGE_ENCRYPTION=true

# File upload limits

MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,mp4

# ==========================================

# SUBSCRIPTION & BILLING

# ==========================================

# Subscription tiers

PREMIUM_MONTHLY_PRICE=9.99
PREMIUM_YEARLY_PRICE=99.99
GOLD_MONTHLY_PRICE=19.99
GOLD_YEARLY_PRICE=199.99

# Free tier limits

FREE_LIKES_PER_DAY=10
FREE_SUPER_LIKES_PER_DAY=1

# ==========================================

# LOCALIZATION

# ==========================================

# Default language and timezone

DEFAULT_LANGUAGE=en
DEFAULT_TIMEZONE=UTC
SUPPORTED_LANGUAGES=en,es,fr,de,it,pt

# ==========================================

# ADMIN PANEL

# ==========================================

# Admin authentication

ADMIN_EMAIL=admin@habibi.app
ADMIN_PASSWORD=change-this-secure-password
ADMIN_SECRET_KEY=admin-secret-key

# ==========================================

# WEBHOOKS

# ==========================================

# External webhook URLs

WEBHOOK_USER_SIGNUP=https://yourapi.com/webhooks/user-signup
WEBHOOK_NEW_MATCH=https://yourapi.com/webhooks/new-match
WEBHOOK_PAYMENT_SUCCESS=https://yourapi.com/webhooks/payment-success

# ==========================================

# CUSTOM SETTINGS

# ==========================================

# Add your custom environment variables here

CUSTOM_API_ENDPOINT=https://api.yourservice.com
CUSTOM_SECRET_KEY=your-custom-secret
