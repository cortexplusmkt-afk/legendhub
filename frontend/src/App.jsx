import React, { useState, useEffect } from 'react';
import { Box, Button, Container, FormControl, FormLabel, Heading, Input, Text, useToast, VStack, Tabs, TabList, Tab, TabPanels, TabPanel, Flex, useColorModeValue, Spinner, Center } from '@chakra-ui/react';
import api from './api';

// Importa TODOS os nossos componentes
import Layout from './components/Layout';
import AdminPanel from './components/AdminPanel';
import MedicalPanel from './components/MedicalPanel';
import CheckinPanel from './components/CheckinPanel';
import ParticipantPortal from './components/ParticipantPortal';
import SplashScreen from './components/SplashScreen';
import LadysPanel from './components/LadysPanel'; // Importa o painel Ladys

const cpfMask = (value) => {
  return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
};

function App() {
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [participantCpf, setParticipantCpf] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userType, setUserType] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionLoading, setSessionLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    const savedSession = localStorage.getItem('legendHubToken');
    if (savedSession) {
      try {
        const { token, user, type } = JSON.parse(savedSession);
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setToken(token);
          setLoggedInUser(user);
          setUserType(type);
        } else {
          localStorage.removeItem('legendHubToken');
        }
      } catch(e) {
        localStorage.removeItem('legendHubToken');
      }
    }
    setSessionLoading(false);
  }, []);

  const handleLoginSuccess = (token, user, type) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('legendHubToken', JSON.stringify({ token, user, type }));
      setToken(token);
      setLoggedInUser(user);
      setUserType(type);
      setShowSplash(true);
      setTimeout(() => {
        setShowSplash(false);
      }, 2500);
    } else {
        toast({ title: 'Falha no Login', description: 'O servidor não retornou um token de acesso.', status: 'error' });
    }
  };

  const handleStaffLogin = async (event) => {
    if (event) event.preventDefault(); 
    setIsLoading(true);
    try {
      const response = await api.post(`/auth/login`, { email: staffEmail, password: staffPassword });
      handleLoginSuccess(response.data.token, response.data.user, 'staff');
    } catch (error) { 
      toast({ title: 'Erro no login.', description: error.response?.data?.message, status: 'error', duration: 5000, isClosable: true }); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleParticipantLogin = async (event) => {
    if (event) event.preventDefault();
    setIsLoading(true);
    try {
      const cleanCpf = participantCpf.replace(/\D/g, ''); 
      const response = await api.post(`/participants/login`, { cpf: cleanCpf, email: participantEmail });
      handleLoginSuccess(response.data.token, response.data.participant, 'participant');
    } catch (error) { 
      toast({ title: 'Erro no login.', description: error.response?.data?.message, status: 'error', duration: 5000, isClosable: true }); 
    } finally { 
      setIsLoading(false); 
    }
  };
  
  const handleLogout = () => {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('legendHubToken');
    setToken(null);
    setLoggedInUser(null);
    setUserType(null);
  };

  if (isSessionLoading) {
    return ( <Center h="100vh" bg="gray.50"><Spinner size="xl" color="orange.500" /></Center> );
  }

  if (showSplash) {
    return <SplashScreen user={loggedInUser} userType={userType} />;
  }

  if (token) {
    let panelToRender;

    if (userType === 'staff' && loggedInUser) {
      // Lógica de renderização simplificada e corrigida
      if (loggedInUser.role === 'admin') {
        panelToRender = <AdminPanel />;
      } else if (loggedInUser.role === 'medical') {
        panelToRender = <MedicalPanel />;
      } else if (loggedInUser.role === 'checkin') {
        panelToRender = <CheckinPanel />;
      } else if (loggedInUser.role === 'lady') {
        panelToRender = <LadysPanel />;
      } else {
        panelToRender = <Text>Painel não encontrado para esta função.</Text>;
      }
    } else if (userType === 'participant') {
      panelToRender = <ParticipantPortal 
        initialParticipantData={loggedInUser}
        onUpdate={(updatedData) => setLoggedInUser(updatedData)}
      />;
    }

    return (
      <Layout user={loggedInUser} onLogout={handleLogout}>
        {panelToRender}
      </Layout>
    );
  }

  return (
    <Flex minH="100vh" fontFamily="'Inter', sans-serif">
      <Flex flex={1} bgGradient="linear(to-br, orange.400, gray.800)" color="white" align="center" justify="center" direction="column" p={8} display={{ base: 'none', md: 'flex' }}>
        <Heading size="2xl" mb={4}>LegendHub</Heading>
        <Text fontSize="lg">Do cadastro ao check-in: tudo em um só lugar.</Text>
      </Flex>
      <Flex flex={1} align="center" justify="center" bg={useColorModeValue('gray.50', 'gray.900')}>
        <Box p={8} width="full" maxW="450px" borderWidth={1} borderRadius={8} boxShadow="lg" bg={useColorModeValue('white', 'gray.700')}>
          <Heading mb={6} textAlign="center" size="lg">Acessar Plataforma</Heading>
          <Tabs isFitted variant="soft-rounded" colorScheme="orange">
            <TabList>
              <Tab>Sou Service</Tab> 
              <Tab>Sou Participante</Tab>
            </TabList>
            <TabPanels>
              <TabPanel><form onSubmit={handleStaffLogin}><VStack spacing={4}><FormControl isRequired><FormLabel>Email</FormLabel><Input type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} /></FormControl><FormControl isRequired><FormLabel>Senha</FormLabel><Input type="password" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} /></FormControl><Button width="full" mt={4} colorScheme="orange" type="submit" isLoading={isLoading}>Entrar</Button></VStack></form></TabPanel>
              <TabPanel><form onSubmit={handleParticipantLogin}><VStack spacing={4}><FormControl isRequired><FormLabel>CPF</FormLabel><Input placeholder="Digite apenas os números" value={participantCpf} onChange={(e) => setParticipantCpf(cpfMask(e.target.value))} maxLength="14" /></FormControl><FormControl isRequired><FormLabel>Email</FormLabel><Input type="email" value={participantEmail} onChange={(e) => setParticipantEmail(e.target.value)} /></FormControl><Button width="full" mt={4} colorScheme="orange" type="submit" isLoading={isLoading}>Acessar</Button></VStack></form></TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>
    </Flex>
  );
}

export default App;