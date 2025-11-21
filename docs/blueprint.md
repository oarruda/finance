# **App Name**: Family Finance Tracker

## Core Features:

- Secure Authentication: User authentication system with default credentials (rafael@rafaelarruda.com / admin123), leveraging Firebase security for controlled access.
- Transaction Dashboard: Interactive dashboard displaying financial data with charts for expense analysis and investment insights. Includes data from the Firestore database 'finance / studio-9683078069-cbc46'.
- Currency Exchange Rates: Display daily exchange rates for BRL/EUR, BRL/USD, EUR/BRL and USD/BRL.
- WISE Transaction Input: Record WISE transactions with editable date, real-time exchange rate fetching (using an external tool) for the transaction date, and automatic application of WISE's 3.99% conversion fee.
- Data Export: Enable users to export transaction data in .xlsx format.
- User Role Management: Admin panel for managing users, assigning roles (view-only with export permission or admin with full data modification rights), and controlling access to the web app.
- Database Integration: Connect the web app to the specified Firestore database 'finance / studio-9683078069-cbc46', ensuring UTF-8 encoding for data storage and retrieval.

## Style Guidelines:

- Primary color: Deep Blue (#2962FF) for trust and financial stability.
- Background color: Light Gray (#E5E7EB) for a clean, professional feel.
- Accent color: Green (#16A34A) to highlight positive financial data and investment opportunities. Red (#DC2626) to highlight negative data and areas needing attention.
- Body and headline font: 'Inter', a sans-serif for a modern, machined, objective, neutral look.
- Use clean, minimalist icons to represent different transaction categories.
- Dashboard layout should be intuitive, with clear visual hierarchies to showcase important financial data.
- Subtle transitions and animations for a smooth user experience when navigating the dashboard and inputting transactions.