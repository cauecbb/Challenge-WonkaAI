import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Landing from './components/Landing/Landing';
import LabelValidationPage from './componants/LabelValidationPage';
import ClientsPage from './componants/ClientsPage';
import ClientDetailsPage from './componants/ClientDetailsPage';
import Sidebar from './componants/side_bar/Sidebar';
import { Box, Flex } from '@chakra-ui/react';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ChakraProvider>
      <Router>
        <Routes>
          {/* Landing page route */}
          <Route path="/" element={<Landing />} />
          
          {/* Main app routes with sidebar */}
          <Route path="/dashboard" element={
            <Flex height="100vh">
              <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
              <Box flex="1" overflow="hidden" ml={{ base: 0, md: sidebarOpen ? '250px' : '60px' }}>
                <LabelValidationPage onReportStatusChange={() => {}} />
              </Box>
            </Flex>
          } />
          
          <Route path="/clients" element={
            <Flex height="100vh">
              <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
              <Box flex="1" overflow="hidden" ml={{ base: 0, md: sidebarOpen ? '250px' : '60px' }}>
                <ClientsPage />
              </Box>
            </Flex>
          } />

          <Route path="/clients/:clientId" element={
            <Flex height="100vh">
              <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
              <Box flex="1" overflow="hidden" ml={{ base: 0, md: sidebarOpen ? '250px' : '60px' }}>
                <ClientDetailsPage />
              </Box>
            </Flex>
          } />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
