import React, { useState } from 'react';
import { Box, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';

// Importa todos os painéis que o admin vai usar
import Dashboard from './Dashboard';
import MedicalPanel from './MedicalPanel';
import CheckinPanel from './CheckinPanel';
import AdminTools from './AdminTools';
import UserManagementPanel from './UserManagementPanel';
import WhatsappPanel from './WhatsappPanel'; // A sala que construímos

const AdminPanel = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const handleNavigate = (index) => setTabIndex(index);

  return (
    <Box>
      <Tabs index={tabIndex} onChange={setTabIndex} variant="soft-rounded" colorScheme="orange">
        <TabList mb={6} overflowX="auto" pb={2}>
          <Tab>Dashboard</Tab>
          <Tab>Validação Médica</Tab>
          <Tab>Check-in</Tab>
          <Tab>Equipe</Tab>
          <Tab>Ferramentas</Tab>
          {/* A PORTA QUE FALTAVA */}
          <Tab>WhatsApp</Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={0}><Dashboard onNavigate={handleNavigate} /></TabPanel>
          <TabPanel p={0}><MedicalPanel /></TabPanel>
          <TabPanel p={0}><CheckinPanel /></TabPanel>
          <TabPanel p={0}><UserManagementPanel /></TabPanel>
          <TabPanel p={0}><AdminTools /></TabPanel>
          {/* A SALA SENDO USADA */}
          <TabPanel p={0}><WhatsappPanel /></TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AdminPanel;