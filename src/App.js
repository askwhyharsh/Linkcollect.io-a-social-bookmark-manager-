import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

import Signup from './pages/Signup';
import Login from './pages/Login';
import { useEffect, useState } from 'react';
import Privacy from './components/PrivacyPolicy/Privacy';
import Bookmarks from './pages/Bookmarks';
import Home from './pages/Home';
import Settings from './pages/Settings';
import { setJwtInRequestHeader } from './api-services/httpService';
import Explore from './pages/Explore';
import SavedCollection from './pages/SavedCollection';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetails } from './store/actions/user.action';
import PageLoader from './components/UI/Loader/PageLoader';
import { setLoggedInUser } from './store/Slices/user.slice';
import LandingPageV2 from './pages/LandingPageV2';
import { HelmetProvider } from 'react-helmet-async';
import ReactGA from 'react-ga';
import AdminPanel from './pages/AdminPage';

const TRACKING_ID = 'G-6NHCQSCVJP';

ReactGA.initialize(TRACKING_ID);

function App() {
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search);
  }, []);

  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();

  //for responsiveness
  let width;
  if (typeof window !== 'undefined') {
    width = window.innerWidth;
  }
  const [windowWidth, setWindowWidth] = useState(width);

  useEffect(() => {
    function watchWidth() {
      setWindowWidth(window.innerWidth);
    }

    window.addEventListener('resize', watchWidth);
  }, [windowWidth]);

  // To set JWT token in request header for authorization on each API call
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !auth.isLoggedIn) {
      setJwtInRequestHeader(token);
      dispatch(setLoggedInUser({ token }));
      dispatch(getUserDetails({ token }));
    }
  }, []);

  if (auth.isLoggedIn && auth.isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <PageLoader />
      </div>
    );
  }
  const helmetContext = {};

  return (
    <HelmetProvider context={helmetContext}>
      <Router>
        <div className="App">
          <Routes>
            {/* Landing page  */}
            <Route
              path="/"
              element={
                auth.isLoggedIn ? (
                  <Navigate to={`/${auth?.username}`} />
                ) : (
                  <LandingPageV2 windowWidth={windowWidth} />
                )
              }
            />

            <Route
              path="/signup"
              element={
                auth.isLoggedIn ? (
                  <Navigate to={`/${auth?.username}`} />
                ) : (
                  <Signup windowWidth={windowWidth} />
                )
              }
            />
            <Route
              path="/login"
              element={
                auth.isLoggedIn ? (
                  <Navigate to={`/${auth?.username}`} />
                ) : (
                  <Login windowWidth={windowWidth} />
                )
              }
            />

            {/* Admin Route - Protected */}
            <Route
              path="/admin/admin/admin"
              element={
                // <ProtectedAdminRoute>
                <AdminPanel windowWidth={windowWidth} />
                // </ProtectedAdminRoute>
              }
            />

            {/* Open routes */}
            <Route
              path="/:username"
              element={<Home windowWidth={windowWidth} />}
            />
            <Route
              path="/explore"
              element={<Explore windowWidth={windowWidth} />}
            />
            <Route
              path="/saved"
              element={<SavedCollection windowWidth={windowWidth} />}
            />
            <Route
              path="/settings"
              element={<Settings windowWidth={windowWidth} />}
            />

            <Route path="/privacy" element={<Privacy />} />
            <Route
              path="/:username/c/:collectionId"
              element={<Bookmarks windowWidth={windowWidth} />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <Analytics />
      </Router>
    </HelmetProvider>
  );
}

export default App;
