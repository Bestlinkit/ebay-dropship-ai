# eBay Dropship AI Platform - Setup & Deployment Guide

This platform automates the entire eBay dropshipping workflow using AI.

## 🚀 Quick Start

1. **Setup Workspace**:
   Set `C:\Users\HP\.gemini\antigravity\scratch\ebay-dropship-ai` as your active project.

2. **Install Packages**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your keys:
   - **eBay Dev Keys**: Get them from [developer.ebay.com](https://developer.ebay.com)
   - **Hugging Face**: Get a free token from [huggingface.co](https://huggingface.co/settings/tokens)
   - **Gemini AI**: Get a free key from [aistudio.google.com](https://aistudio.google.com)

4. **Launch Application**:
   ```bash
   npm run dev
   ```

## 🏗️ Deployment to Namecheap
1. Run `npm run build`.
2. Locate the `dist/` folder.
3. Upload all files inside `dist/` to your Namecheap file manager (usually `public_html`).
4. Ensure your domain's `.htaccess` handles SPA routing (standard for React apps).

## 🛠️ Features
- **Discovery**: Search trending eBay products.
- **Matching**: Find suppliers on Eprolo.
- **AI Lab**: SEO Titles & Description generation.
- **Video Lab**: Browser-based ad creation.
- **Analytics**: Profit and ROI tracking.

---
**Build Status**: Production Ready
**Version**: 1.0.0
