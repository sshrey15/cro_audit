# 🔑 Environment Setup Guide

## Getting Your Gemini API Key

### Step-by-Step Instructions

#### 1. **Visit Google AI Studio**
   - URL: https://aistudio.google.com/app/apikey
   - Make sure you're logged into a Google account
   - If not, click "Sign in" first

#### 2. **Create an API Key**
   - Click the "Create API Key" button
   - Select "Create API Key in New Project"
   - Google will generate a unique key

#### 3. **Copy the Key**
   - You'll see a key that looks like: `AIzaSyD...example...abc123`
   - Click the copy icon next to it
   - Keep this safe (don't share it!)

#### 4. **Create .env.local File**
   
   In your project root (`/Users/shreykumarsingh/Desktop/freelance/blue_bagels_product/`):
   
   ```bash
   # Create the file
   touch .env.local
   
   # Open in editor and add this line:
   GOOGLE_GEMINI_API_KEY=AIzaSyD...your_actual_key_here
   ```

   Or use VS Code:
   - Press `Cmd+K Cmd+O` to open the folder
   - Right-click in the file explorer
   - Create a new file: `.env.local`
   - Paste: `GOOGLE_GEMINI_API_KEY=your_key_here`

#### 5. **Verify the File**
   ```bash
   # Check that the file was created
   cat .env.local
   
   # Output should show:
   # GOOGLE_GEMINI_API_KEY=AIzaSy...
   ```

#### 6. **Restart Dev Server**
   ```bash
   # If currently running, stop it (Ctrl+C)
   # Then start again:
   pnpm dev
   ```

---

## Checking Your Setup

### Verify API Key is Working

1. **Open application**: http://localhost:3000/audit
2. **Open browser console**: `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows)
3. **Try a simple URL**: `example.com`
4. **Click "Analyze Now"**
5. **Check console** for:
   - ✅ No errors about missing API key
   - ✅ Requests to Gemini API
   - ✅ Screenshot capture logs

### Test API Key Validity

You can quickly test your key:

```bash
# Run this in terminal (replace YOUR_KEY):
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello, what is 2+2?"
      }]
    }]
  }'
```

If you see a text response back, your key works! ✅

---

## Troubleshooting Setup Issues

### Issue: "GOOGLE_GEMINI_API_KEY is undefined"

**Problem**: The `.env.local` file wasn't found or read.

**Solutions**:
1. Make sure file is named exactly `.env.local` (not `.env` or `env.local`)
2. File should be in project root: `/Users/shreykumarsingh/Desktop/freelance/blue_bagels_product/.env.local`
3. Restart dev server after creating file
4. Check there are no extra spaces: `GOOGLE_GEMINI_API_KEY=ABC123` (not `= ABC123 `)

### Issue: "Invalid API Key"

**Problem**: The key is invalid, expired, or revoked.

**Solutions**:
1. Create a new key at https://aistudio.google.com/app/apikey
2. Delete old key if you have multiple
3. Wait 5 minutes for changes to propagate
4. Restart dev server

### Issue: "Rate limit exceeded"

**Problem**: You've made too many requests (free tier limit: 15/min).

**Solutions**:
1. Wait a few minutes before testing again
2. Upgrade to paid API at https://console.cloud.google.com
3. Use Gemini 1.5 Flash (more efficient)
4. Implement request queuing in production

### Issue: "Cannot find module '@google/generative-ai'"

**Problem**: Package wasn't installed correctly.

**Solutions**:
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Ensure the package is added
pnpm add @google/generative-ai

# Check installation
pnpm list | grep generative-ai
```

---

## .env.local Template

Copy this exact format into your `.env.local` file:

```bash
# Google Gemini API Key
# Get from: https://aistudio.google.com/app/apikey
GOOGLE_GEMINI_API_KEY=AIzaSyD_example_key_paste_yours_here_ab12cd34ef56gh78
```

⚠️ **Important**:
- Replace the example with your actual key
- No quotes needed
- No spaces around the `=`
- Keep this file private (add to `.gitignore`)

---

## Security Best Practices

### ✅ Do's
- ✅ Keep API key in `.env.local` (not in code)
- ✅ Add `.env.local` to `.gitignore`
- ✅ Rotate keys periodically
- ✅ Use different keys for dev/production
- ✅ Monitor API usage in Google Cloud Console

### ❌ Don'ts
- ❌ Share your API key publicly
- ❌ Commit `.env.local` to git
- ❌ Post key in Slack/Discord
- ❌ Use same key across multiple apps
- ❌ Leave key in browser console logs

### .gitignore Configuration
```bash
# Make sure .env files are ignored
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

---

## Multiple Environment Keys

For production deployment:

### Local Development
```bash
# .env.local
GOOGLE_GEMINI_API_KEY=AIzaSyD_dev_key_here
```

### Production
Set in your hosting platform's environment variables:
- **Vercel**: Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment
- **Docker**: Use `docker run -e GOOGLE_GEMINI_API_KEY=...`
- **Heroku**: Config Vars

**Never commit production keys to git!**

---

## Verify Everything Works

After setup, run this checklist:

1. **File exists**
   ```bash
   test -f .env.local && echo "✅ .env.local exists" || echo "❌ Missing .env.local"
   ```

2. **Key is set**
   ```bash
   grep GOOGLE_GEMINI_API_KEY .env.local
   # Should output: GOOGLE_GEMINI_API_KEY=AIzaSy...
   ```

3. **Dev server can read it**
   ```bash
   pnpm dev
   # No errors about missing API key
   ```

4. **API works**
   - Open http://localhost:3000/audit
   - Test with `example.com`
   - Check console for API calls

---

## Next Steps

After setting up the API key:

1. **Start dev server**
   ```bash
   pnpm dev
   ```

2. **Test the application**
   - Go to http://localhost:3000/audit
   - Try with `example.com` or any ecommerce site
   - Watch the loading progress
   - Review the AI-generated recommendations

3. **Check monitoring**
   - Visit https://aistudio.google.com/app/apikey
   - See your request count
   - Monitor free tier usage

4. **Troubleshoot any issues**
   - Check browser console (F12)
   - Check terminal logs
   - Refer back to troubleshooting section

---

## Support Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **API Key Setup**: https://ai.google.dev/tutorials/setup
- **Rate Limits**: https://ai.google.dev/pricing
- **Troubleshooting**: https://ai.google.dev/tutorials/python_quickstart

---

## Quick Reference

| Item | Details |
|------|---------|
| **Where to get key** | https://aistudio.google.com/app/apikey |
| **File location** | `.env.local` in project root |
| **Format** | `GOOGLE_GEMINI_API_KEY=your_key_here` |
| **Free tier limit** | 15 requests/minute |
| **Cost per audit** | ~$0.01-0.05 |
| **When to restart** | After creating/updating `.env.local` |

---

**Setup Time**: 2-3 minutes
**Difficulty**: ⭐ Easy
**Status**: Ready to go! 🚀
