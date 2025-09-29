# TODO: Fix 401 Error Handling and Loading States in AdminClientDashboardPage.jsx

## Information Gathered
- AuthContext has logout function that clears user and token.
- axiosInstance has interceptor for 401/403 but doesn't trigger logout to avoid circular deps.
- AdminClientDashboardPage uses useAuth and has fetch functions with try-catch-finally.
- Loading states are reset in finally, but on 401, should logout and redirect.

## Plan
1. Import useNavigate from react-router-dom.
2. Add useNavigate hook in component.
3. In useEffect, add check: if not isAuthenticated, navigate('/login').
4. In each fetch function (fetchAdminClientProfile, fetchMyEmployees, fetchEmployeeTemperatureRecords, fetchEquipments), add: if (err.response?.status === 401) { logout(); }
5. Ensure loading states are reset in finally blocks (already present).
6. Update axiosInstance to accept logout callback and call it on 401.

## Dependent Files
- frontend/src/pages/AdminClientDashboardPage.jsx
- frontend/src/api/axiosInstance.js

## Followup Steps
- Test the login flow and ensure 401 triggers logout and redirect.
- Verify loading states are properly reset.
