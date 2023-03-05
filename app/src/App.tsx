import { ModalsProvider } from "@mantine/modals";
import { NotificationsProvider } from "@mantine/notifications";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import {
  useFirebaseApp,
  FirestoreProvider,
  AuthProvider,
  useSigninCheck,
} from "reactfire";
import DefaultLayout from "./layouts/default";
import IndexPage from "./pages";
import LoginPage from "./pages/auth/login";
import StationPage from "./pages/station/station";
import StationsPage from "./pages/stations/stations";
import { Text } from "@mantine/core";
import { useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { trpc } from "./utils/trpc";
import { httpBatchLink } from "@trpc/client";
import { QueryClientProvider } from "@tanstack/react-query";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { status: signInCheckStatus, data: signInCheckResult } =
    useSigninCheck();
  const location = useLocation();

  if (signInCheckStatus !== "success") {
    return <Text>Loading...</Text>;
  }

  if (!signInCheckResult.signedIn) {
    return (
      <Navigate
        to={`/auth/login?from=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return children;
}

function App() {
  const firebaseApp = useFirebaseApp();
  const authInstance = getAuth(firebaseApp);
  const firestoreInstance = getFirestore(firebaseApp);
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "https://europe-west1-sam-sim-prod.cloudfunctions.net/trpc",
          // optional
          headers: async () => {
            const currentUser = authInstance.currentUser;
            if (currentUser !== null) {
              const token = await currentUser.getIdToken();
              return {
                authorization: `Bearer ${token}`,
              };
            }
            return {};
          },
        }),
      ],
    })
  );

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<DefaultLayout />}>
        <Route index element={<IndexPage />} />
        <Route path="stations">
          <Route
            index
            element={<ProtectedRoute children={<StationsPage />} />}
          />
          <Route
            path=":stationId"
            element={<ProtectedRoute children={<StationPage />} />}
          />
        </Route>
        <Route path="auth/login" element={<LoginPage />} />
      </Route>
    )
  );

  return (
    <AuthProvider sdk={authInstance}>
      <FirestoreProvider sdk={firestoreInstance}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <NotificationsProvider>
              <ModalsProvider>
                <RouterProvider router={router} />
              </ModalsProvider>
            </NotificationsProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </FirestoreProvider>
    </AuthProvider>
  );
}

export default App;
