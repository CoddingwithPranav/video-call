import './App.css'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import { Landing } from './components/landingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App