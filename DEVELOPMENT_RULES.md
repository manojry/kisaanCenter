
# DEVELOPMENT_RULES.md (Improved)

## 1. API Design
- Endpoints must match ERD entities, relationships, and business rules.
- Implement full CRUD for all major resources (users, shops, products, transactions, payments, credits).
- Request/response schemas must include all required fields and types from the ERD.
- Use Pydantic models for validation and serialization.
- Add pagination, filtering, and sorting to all list endpoints.
- Standardize naming, response format, and status codes across all APIs.

## 2. Validation & Error Handling
- Validate all incoming data using Pydantic and business logic.
- Return structured error responses with clear messages, error codes, and details.
- Handle edge cases (duplicates, missing data, partial updates, permission errors).
- Use consistent error response format:
	```json
	{
		"success": false,
		"message": "Error description",
		"errors": ["Detailed error messages"],
		"error_code": "VALIDATION_ERROR"
	}
	```

## 3. Security
- Enforce role-based access control (RBAC) on all sensitive endpoints.
- Require authentication for all protected resources.
- Use security headers and rate limiting as per API spec.

## 4. Documentation
- Add OpenAPI metadata and examples to all endpoints and schemas.
- Keep API docs up to date with code changes.
- Document business rules, edge cases, and error codes.

## 5. Testing
- Write unit and integration tests for all endpoints, including edge cases and error scenarios.
- Use automated tests and Postman collections for endpoint validation.
- Cover all CRUD, filtering, pagination, and error handling.

## 6. Code Reviews
- Use the PR checklist below for every pull request.
- Review for rule compliance, business logic, and security.

## 7. Monitoring & Observability
- Implement health checks (`/health`, `/api/v1/info`).
- Track request timing, error rates, and audit logs.

## 8. Consistency & Scalability
- Use dynamic router registration for scalable endpoint management.
- Split monolithic service classes; centralize validation and permission checks.
- Standardize naming, response format, and status codes.

---

# PR Checklist Template

- [ ] Follows DEVELOPMENT_RULES.md
- [ ] Endpoints match ERD and business rules
- [ ] Full CRUD implemented for all major resources
- [ ] Schemas include all required fields and types
- [ ] Validation and error handling present and consistent
- [ ] RBAC enforced on sensitive endpoints
- [ ] OpenAPI docs and examples updated
- [ ] Tests written/updated for all endpoints and edge cases
- [ ] Naming, response format, and status codes standardized
- [ ] Pagination/filtering/sorting for list endpoints
- [ ] Health checks and monitoring implemented
- [ ] Code is modular and scalable

---

# How to Use & Track Compliance

1. **Reference this file before starting new features or refactoring.**
2. **Use the checklist in every PR.**
3. **Automate checks with linters, CI/CD, and pre-commit hooks.**
4. **Schedule regular audits for compliance.**
5. **Update this file as your project evolves.**
6. **Review API docs and ERD regularly to ensure alignment.**
7. **Use Postman or Swagger to validate endpoints and schemas.**
8. **Monitor health and error rates in production.**
