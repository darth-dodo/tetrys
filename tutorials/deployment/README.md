# 🚀 Deployment Guide

This comprehensive guide covers deployment strategies, platform-specific configurations, and optimization techniques for deploying Tetrys to various hosting platforms.

## 🎯 Deployment Overview

Tetrys is built as a static single-page application (SPA) that can be deployed to any static hosting platform. The application uses:

- **Build Output**: Static HTML, CSS, JS files in `/dist` directory
- **Routing**: Client-side routing requiring SPA configuration
- **Assets**: Optimized bundles with cache-friendly naming
- **PWA Ready**: Service worker and manifest for offline functionality

## 🏗️ Build Process

### Production Build

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Build for production
npm run build

# Preview build locally
npm run preview
```

### Build Configuration

The build process uses Vite with the following optimizations:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
          audio: ['./src/composables/useAudio.ts'],
          game: ['./src/composables/useTetris.ts']
        }
      }
    },
    cssCodeSplit: true,
    sourcemap: false, // Disable in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

### Build Output Analysis

```bash
# Analyze bundle size
npm run build

# Example output:
# dist/index.html                   0.94 kB │ gzip: 0.51 kB
# dist/assets/index-ABC123.css     31.18 kB │ gzip: 5.55 kB
# dist/assets/index-XYZ789.js      87.69 kB │ gzip: 32.54 kB
```

## 🌐 Platform Deployment Guides

### Netlify (Recommended) ⭐

Netlify provides excellent static site hosting with automatic deployments from Git.

#### Quick Deploy

```bash
# Build the project
npm run build

# Drag and drop dist/ folder to Netlify
# Or deploy with CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Git Integration Setup

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select the `tetrys` repository

2. **Build Settings** (Auto-detected from `netlify.toml`)
   ```toml
   [build]
     publish = "dist"
     command = "npm run build"
   
   [build.environment]
     NODE_VERSION = "20"
   ```

3. **Deploy Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 20

#### Custom Domain Setup

```bash
# Add custom domain in Netlify dashboard
# Or use CLI
netlify domains:add yourdomain.com

# Configure DNS
# Add CNAME record: www.yourdomain.com → your-site.netlify.app
# Add ALIAS/ANAME record: yourdomain.com → your-site.netlify.app
```

#### Netlify Configuration

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

# SPA redirect rules
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = '''
      default-src 'self';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https:;
      script-src 'self';
      connect-src 'self';
    '''

# Cache optimization
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Vercel 🔺

Vercel provides excellent performance with global CDN and zero-config deployments.

#### Setup Process

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy from terminal
   vercel
   
   # Follow prompts to connect GitHub repo
   ```

2. **Configuration File**
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vue",
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ],
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```

3. **Environment Variables**
   ```bash
   # Set in Vercel dashboard or CLI
   vercel env add NODE_VERSION 20
   vercel env add BUILD_COMMAND "npm run build"
   ```

### GitHub Pages 🐙

Free hosting directly from your GitHub repository.

#### Setup Process

1. **Create Workflow File**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       
       steps:
       - name: Checkout
         uses: actions/checkout@v4
       
       - name: Setup Node.js
         uses: actions/setup-node@v4
         with:
           node-version: '20'
           cache: 'npm'
       
       - name: Install dependencies
         run: npm ci
       
       - name: Run tests
         run: npm test
       
       - name: Build
         run: npm run build
       
       - name: Deploy to GitHub Pages
         uses: peaceiris/actions-gh-pages@v3
         if: github.ref == 'refs/heads/main'
         with:
           github_token: ${{ secrets.GITHUB_TOKEN }}
           publish_dir: ./dist
   ```

2. **Repository Settings**
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose `gh-pages` branch
   - Set path to `/ (root)`

3. **Base URL Configuration**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     base: process.env.NODE_ENV === 'production' 
       ? '/tetrys/' // Repository name
       : '/',
     // ... other config
   })
   ```

### Firebase Hosting 🔥

Google's Firebase provides fast global CDN with easy CLI deployment.

#### Setup Process

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Project**
   ```bash
   firebase init hosting
   
   # Configuration:
   # Public directory: dist
   # Single-page app: Yes
   # GitHub integration: Optional
   ```

3. **Firebase Configuration**
   ```json
   // firebase.json
   {
     "hosting": {
       "public": "dist",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ],
       "headers": [
         {
           "source": "/assets/**",
           "headers": [
             {
               "key": "Cache-Control",
               "value": "public, max-age=31536000, immutable"
             }
           ]
         }
       ]
     }
   }
   ```

4. **Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

### Docker Deployment 🐳

Containerized deployment for maximum flexibility.

#### Dockerfile

```dockerfile
# Multi-stage build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types
        text/plain
        text/css
        text/js
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if needed)
    # location /api/ {
    #     proxy_pass http://backend:3000;
    #     proxy_set_header Host $host;
    #     proxy_set_header X-Real-IP $remote_addr;
    # }
}
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  tetrys:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    
  # Optional: Reverse proxy with SSL
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - tetrys
```

#### Build and Deploy

```bash
# Build Docker image
docker build -t tetrys .

# Run locally
docker run -p 8080:80 tetrys

# Deploy with docker-compose
docker-compose up -d

# Deploy to cloud
docker tag tetrys your-registry/tetrys:latest
docker push your-registry/tetrys:latest
```

## ⚡ Performance Optimization

### Build Optimizations

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          vue: ['vue'],
          
          // Game logic
          game: ['./src/composables/useTetris.ts'],
          
          // Audio system (largest composable)
          audio: ['./src/composables/useAudio.ts'],
          
          // Theme system
          themes: ['./src/composables/useTheme.ts', './src/types/theme.ts']
        }
      }
    },
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    },
    
    // Code splitting
    cssCodeSplit: true,
    
    // Generate manifest for PWA
    manifest: true
  }
})
```

### Compression Setup

```nginx
# nginx.conf - Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied expired no-cache no-store private must-revalidate auth;
gzip_types
    text/css
    text/javascript
    text/xml
    text/plain
    text/x-component
    application/javascript
    application/x-javascript
    application/json
    application/xml
    application/rss+xml
    application/atom+xml
    font/truetype
    font/opentype
    application/vnd.ms-fontobject
    image/svg+xml;

# Brotli compression (if available)
brotli on;
brotli_comp_level 6;
brotli_types
    text/xml
    image/svg+xml
    application/x-font-ttf
    image/vnd.microsoft.icon
    application/x-font-opentype
    application/json
    font/eot
    application/vnd.ms-fontobject
    application/javascript
    font/otf
    application/xml
    application/xhtml+xml
    text/javascript
    application/x-javascript
    text/$;
```

### CDN Integration

```typescript
// For external CDN assets
const CDN_URL = process.env.VITE_CDN_URL || ''

// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['vue'], // If loading from CDN
      output: {
        paths: {
          vue: `${CDN_URL}/vue@3/dist/vue.global.js`
        }
      }
    }
  }
})
```

## 🔒 Security Configuration

### Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  script-src 'self';
  connect-src 'self';
  media-src 'self' blob:;
">
```

### Security Headers

```nginx
# Security headers
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# HTTPS redirect
if ($scheme != "https") {
    return 301 https://$host$request_uri;
}
```

### Environment Variables

```bash
# .env.production
VITE_NODE_ENV=production
VITE_CDN_URL=https://cdn.example.com
VITE_ANALYTICS_ID=GA_TRACKING_ID
```

## 📊 Monitoring & Analytics

### Performance Monitoring

```typescript
// src/utils/performance.ts
export const trackPerformance = () => {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const perfData = performance.timing
      const loadTime = perfData.loadEventEnd - perfData.navigationStart
      
      // Send to analytics
      console.log('Page load time:', loadTime)
    })
  }
}

// Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

### Error Tracking

```typescript
// src/utils/error-tracking.ts
export const setupErrorTracking = () => {
  window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error)
    // Send to error tracking service
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    // Send to error tracking service
  })
}
```

## 🚨 Troubleshooting

### Common Deployment Issues

#### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build

# Check for TypeScript errors
npm run type-check

# Check for linting issues
npm run lint
```

#### Routing Issues (404 on Refresh)

SPA applications need server-side configuration to handle client-side routing:

```nginx
# Nginx configuration
location / {
    try_files $uri $uri/ /index.html;
}
```

```apache
# Apache .htaccess
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QR,L]
```

#### Audio Issues in Production

Audio requires HTTPS in production:

```typescript
// Check for secure context
if (!window.isSecureContext) {
  console.warn('Audio requires HTTPS in production')
}
```

#### Performance Issues

```bash
# Bundle analysis
npm install -g webpack-bundle-analyzer
npx vite build --mode analyze

# Check lighthouse scores
npx lighthouse https://your-domain.com --view
```

## 📋 Deployment Checklist

### Pre-Deployment ✅

- [ ] Run all tests: `npm test`
- [ ] Type checking passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Build completes successfully: `npm run build`
- [ ] Preview build works locally: `npm run preview`
- [ ] Performance testing completed
- [ ] Accessibility testing completed
- [ ] Mobile responsive design verified
- [ ] Cross-browser compatibility tested

### Post-Deployment ✅

- [ ] Site loads without errors
- [ ] All game features work correctly
- [ ] Audio system functions properly
- [ ] Theme switching works
- [ ] Settings persist across sessions
- [ ] Mobile touch controls responsive
- [ ] Performance metrics acceptable (Lighthouse score >90)
- [ ] Security headers configured
- [ ] SSL certificate valid
- [ ] CDN caching working
- [ ] Error monitoring active
- [ ] Analytics tracking functional

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test -- --coverage
    
    - name: Type check
      run: npm run type-check
    
    - name: Lint
      run: npm run lint
    
    - name: Build
      run: npm run build
      env:
        NODE_ENV: production
    
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v2.0
      with:
        publish-dir: './dist'
        production-branch: main
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions"
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
    
    - name: Lighthouse CI
      uses: treosh/lighthouse-ci-action@v10
      with:
        urls: |
          https://your-site.netlify.app
        uploadArtifacts: true
        temporaryPublicStorage: true
```

This comprehensive deployment guide ensures Tetrys can be successfully deployed to any modern hosting platform with optimal performance, security, and reliability.