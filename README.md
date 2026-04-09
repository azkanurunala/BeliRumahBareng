# 🏡 BeliRumahBareng

> **Development Period:** July 2025 – October 2025
> **Status:** Ongoing Development

BeliRumahBareng is a modern, full-stack PropTech (Property Technology) web application designed to facilitate joint property purchases. Built with a robust **Next.js 15** architecture and powered by **Google GenAI**, it modernizes the real estate acquisition process through AI-driven insights and a seamless user experience.

## ✨ Key Features
- **AI-Powered Recommendations:** Integrates Google GenAI via Firebase Genkit to provide intelligent property insights or matchmaking.
- **Modern User Interface:** Fully responsive, highly accessible UI built with Tailwind CSS, Shadcn UI, and Radix UI primitives.
- **Robust Data Management:** Utilizes PostgreSQL (via Neon Serverless) and Prisma ORM for reliable, type-safe database interactions.
- **Seamless Cloud Integration:** Leverages Firebase and Vercel Blob for efficient storage and deployment.

## 🛠 Tech Stack
- **Frontend Framework:** Next.js 15 (React 18), TypeScript
- **Styling & UI:** Tailwind CSS, Shadcn UI, Radix UI, Framer Motion (Tailwind-animate)
- **Backend & Database:** Node.js, Prisma ORM, PostgreSQL (Neon Serverless)
- **AI & Cloud:** Firebase, Google GenAI (Genkit), Vercel Blob
- **State & Data Fetching:** React Hook Form, Zod, TanStack React Query

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Firebase account

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd BeliRumahBareng
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```env
   DATABASE_URL="your-neon-postgres-url"
   # Add Firebase and GenAI keys here
   ```
4. Run database migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## 📈 Roadmap / Future Enhancements
- Enhance AI matchmaking algorithms for better joint-purchase recommendations.
- Integrate secure payment gateways for escrow and initial deposits.
- Expand mobile responsiveness and transition towards a PWA (Progressive Web App).

---
*Built with passion to revolutionize joint property ownership.*
