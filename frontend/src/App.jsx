import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import FarmerDashboard from './pages/FarmerDashboard'
import AddFarm from './pages/AddFarm'
import EditFarm from './pages/EditFarm'
import FarmDetails from './pages/FarmDetails'
import LearnMore from './pages/LearnMore'
import LogTreatment from './pages/LogTreatment'
import VetDashboard from './pages/VetDashboard'

const RootRoute = () => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user) {
    if (user.role === 'farmer') return <Navigate to="/farmer-dashboard" />
    if (user.role === 'vet') return <Navigate to="/vet-dashboard" />
  }
  return <Landing />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
        <Route path="/vet-dashboard" element={<VetDashboard />} />
        <Route path="/add-farm" element={<AddFarm />} />
        <Route path="/log-treatment" element={<LogTreatment />} />
        <Route path="/edit-farm/:id" element={<EditFarm />} />
        <Route path="/farm-details/:id" element={<FarmDetails />} />
        <Route path="/learn-more" element={<LearnMore />} />
      </Routes>
    </Router>
  )
}

export default App

