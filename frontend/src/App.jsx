import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import FarmerDashboard from './pages/FarmerDashboard'
import AddFarm from './pages/AddFarm'
import EditFarm from './pages/EditFarm'
import FarmDetails from './pages/FarmDetails'
import LogTreatment from './pages/LogTreatment'

function App() {
  const user = JSON.parse(localStorage.getItem('user'))

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user && user.role === 'farmer' ? <Navigate to="/farmer-dashboard" /> : <Landing />} 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
        <Route path="/add-farm" element={<AddFarm />} />
        <Route path="/log-treatment" element={<LogTreatment />} />
        <Route path="/edit-farm/:id" element={<EditFarm />} />
        <Route path="/farm-details/:id" element={<FarmDetails />} />
      </Routes>
    </Router>
  )
}

export default App

