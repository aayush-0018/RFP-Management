import { Routes, Route, Link } from 'react-router-dom';
import { Users, FileText, Mail } from 'lucide-react';
import { NotificationProvider } from './components/NotificationContext';
import Vendors from './pages/Vendors';
import RFPs from './pages/RFPs';
import Proposals from './pages/Proposals';
import Emails from './pages/Emails';
import './App.css'

function App() {
  return (
    <NotificationProvider>
      <div className="app">
        <nav>
          <Link to="/vendors">
            <Users size={18} />
            Vendors
          </Link>
          <Link to="/rfps">
            <FileText size={18} />
            RFPs
          </Link>
          {/* <Link to="/emails">
            <Mail size={18} />
            Emails
          </Link> */}
        </nav>
        <main>
          <Routes>
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/rfps" element={<RFPs />} />
            <Route path="/proposals/:rfpId" element={<Proposals />} />
            <Route path="/emails" element={<Emails />} />
            <Route path="/" element={<Vendors />} />
          </Routes>
        </main>
      </div>
    </NotificationProvider>
  )
}

export default App
