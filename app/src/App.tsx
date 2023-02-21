import { ModalsProvider } from '@mantine/modals';
import { NotificationsProvider } from '@mantine/notifications';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
  useLocation
} from "react-router-dom";
import { useFirebaseApp, FirestoreProvider, AuthProvider, useSigninCheck } from 'reactfire';
import DefaultLayout from './layouts/default';
import IndexPage from './pages';
import LoginPage from './pages/auth/login';
import StationPage from './pages/station';
import StationsPage from './pages/stations';
import { Text } from '@mantine/core';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { status: signInCheckStatus, data: signInCheckResult } = useSigninCheck();
  const location = useLocation();

  if (signInCheckStatus !== 'success') {
    return (
      <Text>
        Loading...
      </Text>
    );
  }

  if (!signInCheckResult.signedIn) {
    return <Navigate to={`/auth/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
};

function App() {
  const firebaseApp = useFirebaseApp();
  const authInstance = getAuth(firebaseApp);
  const firestoreInstance = getFirestore(firebaseApp);
  
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path='/' element={<DefaultLayout />}>
        <Route index element={<IndexPage />} />
        <Route path='stations'>
          <Route index element={<ProtectedRoute children={<StationsPage />} />} />
          <Route path=':stationId' element={<ProtectedRoute children={<StationPage />} />} />
        </Route>
        <Route path='auth/login' element={<LoginPage />} />
      </Route>
    )
  )

  return (
    <AuthProvider sdk={authInstance}>
      <FirestoreProvider sdk={firestoreInstance}>
        <NotificationsProvider>
          <ModalsProvider>
            <RouterProvider router={router} />
          </ModalsProvider>
        </NotificationsProvider>
      </FirestoreProvider>
    </AuthProvider>
    
  )
}

export default App
