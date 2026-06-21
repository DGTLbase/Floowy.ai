# Stripe Receipt and Invoice Configuration Guide

## Overview
Stripe provides automatic receipt and invoice functionality for payments and subscriptions. This document outlines how to enable and configure these features.

## Automatic Receipt Configuration

### For Checkout Sessions (One-time Payments & Subscriptions)
Stripe can automatically send receipts when using Checkout Sessions. To enable:

1. **Enable in Stripe Dashboard:**
   - Go to [Customer emails settings](https://dashboard.stripe.com/settings/emails)
   - Toggle on "Successful payments" to send receipts for successful payments
   - Toggle on "Refunds" to send refund receipts automatically

2. **Configure in Code:**
   When creating a Checkout Session, you can specify receipt options:
   ```typescript
   const session = await stripe.checkout.sessions.create({
     customer: customerId,
     customer_email: customerEmail, // If no customer exists
     line_items: [...],
     mode: "subscription", // or "payment"
     success_url: "...",
     cancel_url: "...",
     // Stripe will automatically send receipt based on your email settings
   });
   ```

### For Subscription Payments
When a customer pays an invoice or makes a subscription payment:
- Stripe automatically creates a receipt
- The receipt is itemized with line items, discounts, and taxes
- The [Hosted Invoice Page](https://docs.stripe.com/invoicing/hosted-invoice-page) includes a downloadable receipt link
- Customers can access their payment history and receipts

### Refund Receipts
To enable automatic refund receipts:
1. Go to [Customer emails settings](https://dashboard.stripe.com/settings/emails)
2. Toggle **Refunds** on
3. Refund receipts will be sent to the same email address from the original charge

## Receipt Customization

### Branding Settings
Customize receipt appearance in your [Branding settings](https://dashboard.stripe.com/settings/branding):
- Company logo
- Brand colors
- Business information
- Support email and phone

### Receipt Email Settings
Configure in [Customer emails settings](https://dashboard.stripe.com/settings/emails):
- Email sender name
- Reply-to email address
- Email footer text
- Language preferences

## Manual Receipt Sending

### Via Dashboard
1. Navigate to **Payments** section
2. Click on a specific payment
3. In **Receipt history** section, click **Send receipt**
4. Enter email address (or comma-separated list for multiple recipients)
5. Last 10 receipts sent are visible on the payment's page

### Via API
Use the `receipt_url` from the Charge object:
```typescript
const charge = await stripe.charges.retrieve(chargeId);
const receiptUrl = charge.receipt_url;
// Share this URL with your customer
```

## Important Receipt Features

### Security
- Receipt links expire after 30 days
- Expired links require customer to provide original email to resend
- Receipts show latest status (including any refunds)

### Content
Each receipt contains:
- Unique [receipt number](https://docs.stripe.com/api#charge_object-receipt_number)
- Payment amount and method
- Business information
- Link to view in browser
- Transaction details

### Access Receipt URL
For subscription payments, access receipt via:
```typescript
const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
  expand: ['latest_charge']
});
const receiptUrl = paymentIntent.latest_charge.receipt_url;
```

## Current Implementation

### Webhooks Handle Credit Addition
The `stripe-webhook` and `stripe-webhook-subscription` edge functions already handle:
- Credit pack purchases → adds credits to user account
- Subscription payments → adds monthly/yearly credits to user account
- Stripe handles receipt sending automatically based on dashboard settings

### Recommendation
**Enable automatic receipts in Stripe Dashboard:**
1. Go to: https://dashboard.stripe.com/settings/emails
2. Enable "Successful payments" 
3. Enable "Refunds"
4. Configure branding: https://dashboard.stripe.com/settings/branding

This ensures customers receive professional receipts for all purchases without requiring custom email implementation.

## Testing
A test email function has been created at `supabase/functions/test-subscription-email` to verify email delivery for subscription upgrade notifications.

---

For more information, see:
- [Stripe Receipts Documentation](https://docs.stripe.com/receipts)
- [Stripe Customer Emails Documentation](https://docs.stripe.com/invoicing/send-email)
