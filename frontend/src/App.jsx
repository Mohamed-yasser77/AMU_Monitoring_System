import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import FarmerDashboard from './pages/FarmerDashboard'
import AddFarm from './pages/AddFarm'
import EditFarm from './pages/EditFarm'
import FarmDetails from './pages/FarmDetails'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
        <Route path="/add-farm" element={<AddFarm />} />
        <Route path="/edit-farm/:id" element={<EditFarm />} />
        <Route path="/farm-details/:id" element={<FarmDetails />} />
      </Routes>
    </Router>
  )
}

export default App

