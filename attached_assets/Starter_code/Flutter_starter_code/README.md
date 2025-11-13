# Insurance Portal – Flutter Starter (Golden Repo Template)

Production-ready Flutter starter for Insurance apps. Includes domain views (Policies, Claims, Customers, Underwriting, Reports), API service with env, Provider-based auth role, sample JSON assets, and a widget test.

## Tech
- Flutter (Material 3)
- provider, http, flutter_dotenv
- flutter_test

## Structure
```
Flutter_starter_code/
  lib/
    main.dart
    src/
      routes.dart
      providers/auth_provider.dart
      services/api_service.dart
      models/policy.dart
      widgets/policy_card.dart
      views/
        dashboard_page.dart
        policies_page.dart
        claims_page.dart
        customers_page.dart
        underwriting_page.dart
        reports_page.dart
  assets/data/
    insurancePolicies.json
    customers.json
    claims.json
  pubspec.yaml, .gitignore, README.md, .env.example
```

## Setup
```bash
flutter pub get
flutter run
```

## Environment
Create `.env` (see `.env.example`):
- `API_BASE_URL` (optional; when empty, local assets are used)
- `DEFAULT_ROLE` (agent | underwriter | admin)

## Notes
- `ApiService` demonstrates example endpoints: `/api/policies`, `/api/claims`, `/api/underwriting/evaluate`.
- For real backend, set `API_BASE_URL` and ensure CORS is enabled.

## Test
```bash
flutter test
```

MIT
