# Gemini Life Intelligence & Reflection Journal

A private, user-authenticated Personal AI Life Intelligence application powered by **Gemini 3.6 Flash** and **Google Cloud Firestore**. It transforms daily reflections into structured life intelligence across 5 primary sections: **Dashboard**, **Journal**, **Analysis**, **Calendar**, and **Settings**.

---

## 1. Architecture & Threat Model Countermeasures

The product executes the complete intelligence loop:
$$\text{Capture} \longrightarrow \text{Understand} \longrightarrow \text{Remember} \longrightarrow \text{Analyze} \longrightarrow \text{Explain} \longrightarrow \text{Act}$$

### 5-Zone Threat Modeling

| Threat Zone | Identified Risks | Countermeasures Implemented |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Injection in journal text, malicious payloads, prompt injection | Strict server validation, JSON payload bounds, explicit demarcation of user text as data in Gemini prompt templates. |
| **2. Planning & Reasoning** | Prompt injection trying to alter authoritative data | Authoritative tasks are kept strictly user-managed; Gemini can only propose `PossibleTaskCompletion` requiring explicit user approval. |
| **3. Tool Execution** | Privilege escalation, SSRF, dynamic code execution | No dynamic eval; server API proxies all GenAI calls securely via SDK; zero secret leakage to browser. |
| **4. Memory & State** | Firestore data cross-leakage, multi-user unauthorized access | Strict Firestore security rules: `request.auth != null && request.auth.uid == userId` covering all `/users/{userId}/**` paths. |
| **5. Inter-System Communication** | Gemini rate limits, outages, token leakage | Resilient 4-model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`), server-side Secret Manager integration. |

---

## 2. Prerequisites & Required Google Cloud APIs

Ensure the following Google Cloud APIs are enabled in your Google Cloud Project:

```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 3. Firebase Authentication & Firestore Setup

1. **Firebase Authentication**:
   - Enable **Google Provider** in the Firebase Console under **Authentication &rarr; Sign-in method**.
   - Federated sign-in eliminates storage of user passwords.

2. **Cloud Firestore Rules**:
   Deploy the following rules in `firestore.rules` to enforce document-level owner isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Gemini Configuration & Fallback Ladder

The server proxy in `server.ts` implements a resilient fallback sequence:
1. `gemini-3.6-flash` (Primary default model)
2. `gemini-3.1-flash-lite` (Fast, lightweight fallback)
3. `gemini-flash-latest` (Stable rolling release alias)
4. `gemini-3.7-flash` (High-reasoning final fallback)

All endpoints catch recoverable status codes (`404`, `429`, `500`, `503`) and automatically step to the next tier without dropping the user's input.

---

## 5. Secret Manager & IAM Configuration

Store your Gemini API key in Google Cloud Secret Manager and grant Cloud Run access:

```bash
# 1. Create Secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add API key version
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant Secret Accessor role to the Cloud Run default service account
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 6. Environment Variables

Documented in `.env.example`:

```env
# Required for server-side Gemini intelligence (Injected via Secret Manager in production)
GEMINI_API_KEY=

# Port configuration (Container default: 3000)
PORT=3000
```

---

## 7. Local Development & Testing

```bash
# Install dependencies
npm install

# Start development full-stack server
npm run dev

# Run TypeScript linting and type checking
npm run lint

# Compile and verify production build
npm run build
```

---

## 8. Cloud Run Deployment

Build and deploy the application container to Cloud Run with automatic secret injection:

```bash
gcloud run deploy gemini-reflection-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### Challenge Verification Label

Cloud Run deployment must include the required challenge label:

```bash
gcloud run services update gemini-reflection-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

Verification inspection:
```bash
gcloud run services describe gemini-reflection-journal \
  --region=us-central1 \
  --format="value(metadata.labels['dev-tutorial'])"
```

---

## 9. Security & Compliance Checklist

- [x] **No hardcoded secrets**: All API keys kept strictly server-side.
- [x] **No open Firestore rules**: `allow read, write: if true;` is strictly prohibited and denied.
- [x] **Zero-crash undefined stripping**: All payloads scrubbed before Firestore writes.
- [x] **User text preserved**: User reflections are persisted before AI processing; AI failures never erase text.
- [x] **Authoritative task separation**: AI-detected tasks require explicit user confirmation.
- [x] **Full data sovereignty**: Export all user data as JSON available anytime in Settings.
