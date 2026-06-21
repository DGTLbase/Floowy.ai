import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SQTQBKbAjgJzP4OSGxPchRLXKshl503lwXl4zbRmpxzOr6qjmcZcVdVvCXvKETp86uJLAArhrlTmDp9oYY7Xvev00uyUq87dY';

export const stripePromise = loadStripe(stripePublishableKey);
