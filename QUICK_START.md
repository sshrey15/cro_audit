# 🚀 Quick Start Guide - Gemini-Powered CRO Audit

## 5-Minute Setup

### Step 1: Get Gemini API Key (2 minutes)
1. Visit: https://aistudio.google.com/app/apikey
2. Click "Create API Key" (Google account required)
3. Copy the key

### Step 2: Configure Environment (1 minute)
Create `.env.local` in project root:
```
GOOGLE_GEMINI_API_KEY=paste_your_key_here
```

### Step 3: Install & Run (2 minutes)
```bash
# Install packages (if needed)
pnpm install

# Start dev server
pnpm dev
```

### Step 4: Test It!
1. Open: http://localhost:3000/audit
2. Paste an ecommerce URL (e.g., `example.com`)
3. Click "Analyze Now"
4. Watch the step-by-step loading feedback
5. Review AI-generated CRO recommendations

---

## What Changed?

### 🎯 Old System
- Captured 8-10 screenshots per site
- Used hardcoded rules for recommendations
- Limited to predefined findings

### ✨ New System (Gemini AI)
- Captures 6 strategic screenshots (2 per page type)
- **AI analyzes actual screenshots** for real issues
- Returns specific, context-aware recommendations
- Categorizes by priority (critical/high/medium)
- Shows expected conversion impact

---

## Key Features

✅ **3 Page Types Analyzed**
- Homepage (full-page screenshot)
- Collections (viewport screenshot)  
- Product Pages (viewport screenshot)

✅ **Smart Loading Feedback**
- "🔍 Discovering website structure..."
- "📸 Capturing homepage & product pages..."
- "🤖 Analyzing with AI for CRO insights..."
- "📊 Generating recommendations..."

✅ **Color-Coded Recommendations**
- 🔴 **Critical** (Red) - Major conversion blockers
- 🟠 **High** (Amber) - Important improvements
- 🔵 **Medium** (Blue) - Nice-to-have optimizations

✅ **Both Desktop & Mobile**
- Each page captured at desktop (1440px) and mobile (390px)
- Separate recommendations for each view

---

## Example Results

### Input
```
URL: example.com
```

### Output
```json
{
  "screenshots": 3,
  "suggestions": 9,
  "breakdown": {
    "critical": 2,
    "high": 4,
    "medium": 3
  }
}
```

### Sample Recommendation
```
Priority: Critical
Title: Missing Value Proposition on Hero
Description: Homepage hero lacks clear, benefit-driven headline. Visitors don't immediately understand what you sell.
Impact: 20-30% conversion increase
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module" error | Run `pnpm install` again |
| "API Key not found" | Check `.env.local` exists and restart server |
| "Analysis taking >2 minutes" | Gemini API may be rate limited (free tier: 15/min) |
| "No screenshots captured" | Site may have bot protection - try another URL |

---

## Next Steps

1. **Test with your clients' URLs** to verify accuracy
2. **Collect feedback** on recommendation quality
3. **Fine-tune the AI prompt** based on results
4. **Add PDF export** for client delivery
5. **Set up monitoring** for API usage and costs

---

## API Costs

**Free Tier**: 15 requests/minute
**Cost per audit**: ~$0.01-0.05
**Monthly budget (1000 audits)**: ~$10-50

---

## Support

Need help?
- Check `GEMINI_INTEGRATION.md` for detailed docs
- Review API logs for specific errors
- Test with `https://example.com` first

Happy auditing! 🎉
