import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Paychecks from './pages/Paychecks';
import Purposes from './pages/Purposes';
import Transactions from './pages/Transactions';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/paychecks" element={<Paychecks />} />
        <Route path="/purposes" element={<Purposes />} />
        <Route path="/transactions" element={<Transactions />} />
      </Routes>
    </Layout>
  );
}

export default App;
