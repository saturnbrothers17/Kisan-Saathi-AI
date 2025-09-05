# Kisan Saathi AI 🇮🇳

Kisan Saathi AI ("Farmer's Companion AI") is an advanced, user-friendly web application designed to empower farmers by providing instant, AI-powered crop disease detection and actionable treatment suggestions. By simply uploading a photo of a plant, farmers can get a quick diagnosis and access both conventional and traditional remedies, along with a conversational AI assistant for follow-up questions.

## Technology Stack

This application is built with a modern, robust, and scalable technology stack, leveraging the power of generative AI and cloud infrastructure.

- **Framework**: [Next.js](https://nextjs.org/) (using the App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [React](https://react.dev/) with [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Generative AI**: [Firebase Genkit](https://firebase.google.com/docs/genkit)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Hosting**: [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

## Key Features

- **Dual Image Input**: Users can either upload a plant image from their device or use the live camera feature to capture a photo directly in the app.
- **AI-Powered Disease Prediction**: The core of the app uses a multimodal generative AI model to analyze the plant's image, determine if it's healthy, or predict the specific disease it might have with a confidence score.
- **Bilingual Treatment Suggestions**: For diagnosed diseases, the AI provides both conventional (chemical) and traditional (desi) treatment methods in both English and Hindi.
- **Interactive Kisan Assistant**: After receiving a diagnosis, users can ask follow-up questions to a specialized AI chatbot ("Kisan") to get more clarity on the diagnosis and treatments.
- **Secure User Authentication**: Leverages Firebase Authentication for easy and secure sign-in, creating a personalized experience.

## AI Architecture Explained

The generative AI capabilities are orchestrated using Firebase Genkit flows, which are server-side TypeScript functions that interact with large language models (LLMs).

### AI Flows (`src/ai/flows/`)

1.  **`disease-prediction.ts`**:
    - **Purpose**: This is the first flow that runs. It takes the user's plant image as input.
    - **Process**: The multimodal model analyzes the image to determine if the plant is healthy. If any disease is detected, it identifies the common name of the disease (in English and Hindi) and returns a confidence percentage for its prediction.

2.  **`treatment-suggestions.ts`**:
    - **Purpose**: If a disease is identified, this flow is triggered to provide treatment options.
    - **Process**: It takes the disease name and confidence level as input. Based on this, it generates lists of conventional and traditional treatments in both English and Hindi. It also includes an important note if the confidence level is low.

3.  **`kisan-assistant.ts`**:
    - **Purpose**: This flow powers the interactive chatbot.
    - **Process**: It operates with the full context of the diagnosis—the disease name, confidence score, treatment suggestions, and the original image. When a user asks a follow-up question, this AI provides a helpful, context-aware answer. It is specifically instructed to only answer questions related to the current plant analysis.

This modular, multi-flow approach ensures that the application provides a comprehensive, accurate, and interactive experience for the user.
