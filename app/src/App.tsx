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

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { status: signInCheckStatus, data: signInCheckResult } = useSigninCheck();
  const location = useLocation();

  if (signInCheckStatus !== 'success') {
    return <>Loading...</>;
  }

  if (!signInCheckResult.signedIn) {
    return <Navigate to={`/auth/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
};

function App() {
  const firebaseApp = useFirebaseApp();
  const firestoreInstance = getFirestore(firebaseApp);
  const authInstance = getAuth(firebaseApp);
  
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
    <FirestoreProvider sdk={firestoreInstance}>
      <AuthProvider sdk={authInstance}>
        <NotificationsProvider>
          <ModalsProvider>
            <RouterProvider router={router} />
          </ModalsProvider>
        </NotificationsProvider>
      </AuthProvider>
    </FirestoreProvider>
  )
}

export default App
