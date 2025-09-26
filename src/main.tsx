import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { LobbyPage } from '@/pages/LobbyPage';
import { GamePage } from '@/pages/GamePage';
const router = createBrowserRouter([
  {
    path: "/",
    element: <LobbyPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/game/:gameId",
    element: <GamePage />,
    errorElement: <RouteErrorBoundary />,
  }
]);
// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)