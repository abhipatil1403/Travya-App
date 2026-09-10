import Navbar from './pages/navbar.jsx'
import Home from './pages/home.jsx'
import HomeScreen from './pages/apphome.jsx'
import PoliceDashboard from './pages/policedashboard.jsx'
import ServicesHub from './pages/services.jsx'
import EFIRs from './pages/efirs.jsx'
import AIChat from './pages/aichat.jsx'
import Profile from './pages/profile.jsx'
import PublicDashboard from './pages/publicdashboard.jsx'
import TouristRegistration from './pages/TouristRegistration.jsx'
import TouristDashboard from './pages/touristdashboard.jsx'
import WeatherPage from './pages/weather.jsx'
import ReportForm from './pages/reportform.jsx'
import Signup from './pages/signup.jsx'
import Signin from './pages/signin.jsx'
import HotelsPage from './pages/hotels.jsx'
import LocalEventsPage from './pages/events.jsx'
import LocalRegistration from './pages/LocalRegistration.jsx'
import LocalDashboard from './pages/LocalDashboard.jsx'
import ScanAssist from './pages/scan-assist.jsx'
import QrTest from './pages/qr-test.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'


const router = createBrowserRouter([
  { path: '/', element: <Home/> },
  { path: '/home', element: <Home/> },
  { path: '/apphome', element: <HomeScreen/> },
  { path: '/police', element: <ProtectedRoute allowedRoles={['police']}><PoliceDashboard/></ProtectedRoute> },
  { path: '/efirs', element: <EFIRs/> },
  { path: '/services', element: <ServicesHub/> },
  { path: '/aichat', element: <AIChat/> },
  { path: '/profile', element: <Profile/> },
  { path: '/public', element: <ProtectedRoute allowedRoles={['local']}><PublicDashboard/></ProtectedRoute> },
  { path: '/register', element: <TouristRegistration/> },
  { path: '/dashboard', element: <ProtectedRoute allowedRoles={['tourist']}><TouristDashboard/></ProtectedRoute> },
  { path: '/weather', element: <WeatherPage/> },
  { path: '/report', element: <ReportForm/> },
  { path: '/signup', element: <Signup/> },
  { path: '/signin', element: <Signin/> },
  { path: '/login', element: <Signin/> },
  { path: '/locals', element: <LocalDashboard/> },
  { path: '/services/hotels', element: <HotelsPage/> },
  { path: '/services/events', element: <LocalEventsPage/> },
  { path: '/local-register', element: <LocalRegistration/> },
  { path: '/local-dashboard', element: <LocalDashboard/> },
  { path: '/scan-assist', element: <ScanAssist/> },
  { path: '/qr-test', element: <QrTest/> },
])


function App() {
  
  return (
    
    <div className="App">
    <RouterProvider router={router} />
  </div>
    
  )
}

export default App
