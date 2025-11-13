# Insurance Portal – React Native Starter (Golden Repo Template)

Production-ready React Native starter for Insurance apps. Includes screens for Policies, Claims, Customers, Underwriting, Reports; navigation; minimal auth context; example API service; sample data; and Jest tests.

## Structure
```
React_native_starter_code/
  src/
    App.tsx
    context/AuthContext.tsx
    services/api.ts
    components/PolicyCard.tsx
    screens/
      Dashboard.tsx
      Policies.tsx
      Claims.tsx
      Customers.tsx
      Underwriting.tsx
      Reports.tsx
    data/insurancePolicies.json
    __tests__/PolicyCard.test.tsx
    setupTests.ts
  package.json, tsconfig.json, .gitignore, app.json, index.js
```

## Run
```bash
npm install
npm run start
# In another terminal
npm run android  # or npm run ios
```

## Notes
- Replace `https://example.com` in `src/services/api.ts` with your backend base URL.
- Auth is a minimal role-based context for demonstration.

## Test
```bash
npm test
```

MIT
