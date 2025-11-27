# 🏗️ System Architecture - Gemini CRO Audit

## High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React/Next.js)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌─────────────────┐                    │
│  │ Audit Page   │──────▶ Audit Form      │                    │
│  │  (page.tsx)  │      │ (AuditForm.tsx) │                    │
│  └──────────────┘      └────────┬────────┘                    │
│                                  │                             │
│  ┌──────────────────────────────▼──────────────────────┐      │
│  │           POST /api/audit-gemini                    │      │
│  │           { url: "example.com" }                    │      │
│  └────────────────────────┬─────────────────────────────┘      │
│                           │                                    │
│  ┌──────────────────────────────▼──────────────────────┐      │
│  │       Loading State Display                         │      │
│  │  (4-step progress with animations)                 │      │
│  │  - Discovering website structure                   │      │
│  │  - Capturing homepage & pages                      │      │
│  │  - Analyzing with AI                               │      │
│  │  - Generating recommendations                      │      │
│  └────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/API)                        │
├─────────────────────────────────────────────────────────────────┤
│  /app/api/audit-gemini/route.ts                                 │
│                                                                 │
│  1. Normalize & Validate URL                                   │
│  2. Launch Playwright Browser                                  │
│  3. Discover Pages                                             │
│     ├─ Homepage (direct)                                       │
│     ├─ Collections (regex search)                              │
│     └─ Products (regex search)                                 │
│  4. Capture Screenshots (3 pages × 2 views = 6 images)         │
│     ├─ Desktop (1440px)                                        │
│     └─ Mobile (390px)                                          │
│  5. Convert Images to Base64                                   │
│  6. Call Gemini API                                            │
│  7. Parse & Sort Recommendations                               │
│  8. Return JSON Response                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            External Services (Google Gemini AI)                 │
├─────────────────────────────────────────────────────────────────┤
│  https://generativelanguage.googleapis.com/                     │
│                                                                 │
│  Model: Gemini 1.5 Flash                                       │
│  Input: 6 PNG images + Analysis prompt                         │
│  Output: JSON array of recommendations                         │
│                                                                 │
│  Processing:                                                   │
│  - Analyzes each image                                         │
│  - Identifies conversion barriers                              │
│  - Generates actionable suggestions                            │
│  - Estimates impact of fixes                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Response to Frontend                           │
├─────────────────────────────────────────────────────────────────┤
│  {                                                              │
│    screenshots: [                                              │
│      {                                                         │
│        type: 'homepage',                                       │
│        desktop: '/screenshot/homepage-desktop-...png',         │
│        mobile: '/screenshot/homepage-mobile-...png'            │
│      },                                                        │
│      ...                                                       │
│    ],                                                          │
│    suggestions: [                                              │
│      {                                                         │
│        priority: 'critical',                                   │
│        title: '...',                                           │
│        description: '...',                                     │
│        impact: '...'                                           │
│      },                                                        │
│      ...                                                       │
│    ],                                                          │
│    status: 'success'                                           │
│  }                                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            Results Display (React Component)                    │
├─────────────────────────────────────────────────────────────────┤
│  GeminiResults.tsx                                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Screenshots Section                                 │      │
│  │  ├─ Homepage (desktop + mobile)                      │      │
│  │  ├─ Collection (desktop + mobile)                    │      │
│  │  └─ Product (desktop + mobile)                       │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Recommendations (Color-Coded)                       │      │
│  │  ├─ 🔴 Critical (Red)                                │      │
│  │  ├─ 🟠 High (Amber)                                  │      │
│  │  └─ 🔵 Medium (Blue)                                 │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Summary Statistics                                  │      │
│  │  ├─ Critical Issues                                  │      │
│  │  ├─ High Priority                                    │      │
│  │  ├─ Medium Priority                                  │      │
│  │  └─ Pages Scanned                                    │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Action Buttons                                      │      │
│  │  ├─ Run Another Audit                                │      │
│  │  └─ Download Report                                  │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App (Root)
├── layout.tsx
│   └── Providers
│       └── globals.css (Tailwind)
│
└── audit/ (Page)
    ├── page.tsx (Main Audit Page)
    │   ├── Header (Logo + Tagline)
    │   ├── Hero Section
    │   ├── Audit Form
    │   │   └── AuditForm.tsx
    │   │       ├── URL Input
    │   │       └── Submit Button
    │   ├── Sample Report Link
    │   ├── Loading State
    │   │   └── Progress Dots (4 steps)
    │   ├── Error State
    │   │   └── Error Message
    │   ├── Results Component
    │   │   └── Results.tsx
    │   │       └── GeminiResults.tsx
    │   │           ├── Screenshots
    │   │           ├── Recommendations
    │   │           └── Action Buttons
    │   └── Trust Indicators
    │
    └── api/
        └── audit-gemini/
            └── route.ts
                ├── Browser Automation
                ├── Page Discovery
                ├── Screenshot Capture
                ├── Gemini Integration
                └── Response Generation
```

---

## Data Flow

### 1. User Input
```typescript
{
  url: "example.com"
}
```

### 2. API Processing
```
Browser Launch
  ↓
Navigate Homepage → Screenshot (2 images)
  ↓
Discover Collection → Navigate → Screenshot (2 images)
  ↓
Discover Product → Navigate → Screenshot (2 images)
  ↓
Load Screenshots → Convert to Base64
  ↓
Send to Gemini API with Analysis Prompt
  ↓
Receive Recommendations from Gemini
  ↓
Parse JSON Response
  ↓
Sort by Priority (Critical → High → Medium)
```

### 3. API Response
```json
{
  "screenshots": [
    {
      "type": "homepage|collection|product",
      "desktop": "base64_or_path",
      "mobile": "base64_or_path"
    }
  ],
  "suggestions": [
    {
      "priority": "critical|high|medium",
      "title": "string",
      "description": "string",
      "impact": "string"
    }
  ],
  "status": "success|error"
}
```

### 4. Frontend Rendering
```
Receive Response
  ↓
GeminiResults Component
  ├─ Group Screenshots by Type
  ├─ Group Suggestions by Priority
  ├─ Calculate Statistics
  └─ Render Beautiful UI
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.2
- **Library**: React 19.2.0
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5
- **Build Tool**: Turbopack

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Browser Automation**: Playwright 1.56.1
- **Language**: TypeScript 5

### External Services
- **AI Analysis**: Google Generative AI (Gemini 1.5 Flash)
- **API**: REST via https://generativelanguage.googleapis.com

### Storage
- **Screenshots**: `/public/screenshot/` (temporary)
- **Configuration**: `.env.local`

---

## Page Discovery Logic

### Homepage
```typescript
const baseUrl = normalizeUrl(url);
// Direct navigation - no search needed
```

### Collections
```typescript
// Find links matching:
/shop|collection|catalog|category|browse|products|all-products|store/i
```

### Products
```typescript
// Find links matching:
/product|item|sku|[0-9]{3,}|detail/i
// Exclude category/collection/shop pages
```

---

## Screenshot Capture Strategy

### Desktop
```
Viewport: 1440px width (standard desktop)
Scroll: Full page for homepage, viewport for others
Wait: DOM + Network idle + lazy-load images
Remove: Popups and security overlays
```

### Mobile
```
Viewport: 390px width (iPhone 12 mini)
Scroll: Full page for homepage, viewport for others
Wait: DOM + Network idle + lazy-load images
Remove: Popups and security overlays
```

### Image Format
```
Format: PNG (lossless, good for AI analysis)
Quality: Original (no compression)
Size: Typical 500KB-2MB per audit
```

---

## AI Analysis Flow

### Prompt Template
```
Analyze these [page-type] page screenshots (desktop and mobile).
You are a conversion rate optimization expert.
Identify 3-5 conversion barriers and optimization opportunities.

Return JSON array with:
{
  "priority": "critical|high|medium",
  "title": "Short 5-10 word title",
  "description": "Detailed explanation",
  "impact": "Expected improvement (e.g., 15-25%)"
}

Focus on:
- User experience friction points
- CTA visibility and clarity
- Trust signals and credibility
- Mobile vs desktop differences
- Performance indicators
- Product completeness
- Checkout flow clarity
```

### Gemini Processing
1. Receives both images (desktop + mobile)
2. Analyzes visual elements
3. Compares against CRO best practices
4. Identifies issues specific to [page-type]
5. Generates prioritized recommendations
6. Estimates conversion impact

---

## Error Handling Strategy

### Network Errors
```
Level 1: Try with domcontentloaded wait
  ↓ Fail
Level 2: Try with networkidle wait
  ↓ Fail
Level 3: Try with commit wait
  ↓ Fail
Level 4: Reload and wait
  ↓ Fail
Return: Error message
```

### Page Discovery Errors
```
Homepage: Always succeeds (baseUrl)
Collection: Optional (skip if not found)
Product: Optional (skip if not found)
Continue: Return what was captured
```

### API Errors
```
Catch Gemini API errors
  ↓
Log detailed error
  ↓
Return user-friendly message
  ↓
Frontend shows error UI
```

---

## Performance Optimization

### Sequential Processing
```
Screenshot 1 (2-3 sec)
  ↓
Screenshot 2 (1-2 sec)
  ↓
Screenshot 3 (1-2 sec)
  ↓
Gemini Analysis (15-20 sec)
─────────────
Total: 30-60 seconds
```

### No Parallel Processing
- Screenshots must be sequential (page nav)
- Gemini analysis must be after all screenshots
- UI update after response

### Optimization Opportunities
- Cache page structures
- Reuse browser instance
- Stream Gemini responses
- Lazy load images in results

---

## Security Architecture

### Input Validation
```
URL Input
  ↓
Normalize & validate format
  ↓
Check for malicious patterns
  ↓
Proceed or reject
```

### API Key Protection
```
API Key in .env.local
  ↓
Not in code/git
  ↓
Loaded at server startup
  ↓
Passed to Gemini securely
```

### Data Handling
```
Screenshots: Temporary files
  ↓
Gemini: Sent as base64
  ↓
Response: Parsed and cleaned
  ↓
Storage: Files deleted after response
```

---

## Monitoring & Logging

### Key Metrics
- API response time
- Screenshot capture time
- Gemini analysis time
- Error rates
- API quota usage
- Cost per audit

### Logging Points
- Page navigation attempts
- Screenshot captures
- API calls to Gemini
- Response parsing
- Error conditions

### Future Tracking
- User satisfaction
- Recommendation accuracy
- Implementation rate
- Conversion impact

---

## Scalability Considerations

### Current Limits
- Free tier: 15 req/min
- Cost: ~$0.01-0.05 per audit
- Processing: Sequential

### Scaling Path
1. **Tier 1** (100-1000/month): Free tier + monitoring
2. **Tier 2** (1000-10000/month): Paid API tier
3. **Tier 3** (10000+/month): Dedicated Gemini instance
4. **Tier 4** (100000+/month): Enterprise agreement

### Optimization Strategies
- Request queuing
- Response caching
- Batch processing
- Parallel audits (multiple browsers)
- Image compression

---

## Deployment Architecture

### Local Development
```
.env.local (API key)
  ↓
pnpm dev (dev server)
  ↓
http://localhost:3000/audit
```

### Staging/Production
```
Environment Variables (hosting platform)
  ↓
Build process (pnpm build)
  ↓
Deploy to hosting (Vercel, AWS, etc.)
  ↓
https://yourdomain.com/audit
```

---

## File Structure Summary

```
/app
├── api/
│   └── audit-gemini/
│       └── route.ts (347 lines - Core API)
├── components/
│   ├── AuditForm.tsx (Updated - Form handling)
│   ├── GeminiResults.tsx (NEW - Results display)
│   └── Results.tsx (Updated - Router component)
├── audit/
│   └── page.tsx (Updated - Audit page)
├── layout.tsx
├── page.tsx
└── globals.css

/public
├── logo.svg (or .png)
└── screenshot/ (Temporary storage)

/.env.local (Configuration - NOT in git)

Documentation/
├── QUICK_START.md
├── ENV_SETUP.md
├── GEMINI_INTEGRATION.md
├── IMPLEMENTATION_COMPLETE.md
├── SUMMARY.md
└── ARCHITECTURE.md (this file)
```

---

**This architecture enables**:
✅ Modular, scalable design
✅ Clear separation of concerns
✅ Type-safe TypeScript
✅ Beautiful user experience
✅ Production-ready code
✅ Easy to extend/modify

---

**Last Updated**: November 21, 2025
**Version**: 2.0 (Gemini AI)
**Status**: Ready for deployment
