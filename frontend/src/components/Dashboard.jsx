import React, { useEffect, useState } from 'react';
import { Box, SimpleGrid, Stat, StatLabel, StatNumber, Spinner, useToast, Icon, Flex } from '@chakra-ui/react';
import api from '../api'; // <<< USA NOSSO MENSAGEIRO OFICIAL
import { FiUsers, FiUserX, FiFileText, FiUserCheck, FiCheckSquare } from 'react-icons/fi';

// MUDANÇA: O 'token' não é mais necessário aqui
const Dashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // A chamada agora é mais limpa, sem o objeto 'headers'
        const response = await api.get('/admin/dashboard-stats');
        setStats(response.data);
      } catch (error) {
        toast({ title: 'Erro ao carregar estatísticas.', status: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [toast]); // O token não é mais uma dependência

  if (isLoading) {
    return <Spinner size="xl" />;
  }

  const StatCard = ({ icon, label, value, color, targetTabIndex }) => (
    <Flex 
      as="button"
      onClick={() => onNavigate(targetTabIndex)}
      align="center" 
      p={5} 
      bg="white" 
      borderRadius="xl" 
      boxShadow="lg"
      textAlign="left"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
    >
      <Icon as={icon} boxSize={10} color={`${color}.500`} mr={4} />
      <Box>
        <Stat>
          <StatLabel color="gray.500">{label}</StatLabel>
          <StatNumber fontSize="3xl" fontWeight="bold">{value}</StatNumber>
        </Stat>
      </Box>
    </Flex>
  );

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      <StatCard icon={FiUsers} label="Total de Inscritos" value={stats?.totalParticipants} color="blue" targetTabIndex={2} />
      <StatCard icon={FiUserX} label="Cadastros Pendentes" value={stats?.pendingProfile} color="yellow" targetTabIndex={2} />
      <StatCard icon={FiFileText} label="Atestados em Análise" value={stats?.pendingMedical} color="purple" targetTabIndex={1} />
      <StatCard icon={FiUserCheck} label="100% Aprovados" value={stats?.fullyApproved} color="green" targetTabIndex={2} />
      <StatCard icon={FiCheckSquare} label="Check-ins Realizados" value={stats?.checkedIn} color="teal" targetTabIndex={2} />
    </SimpleGrid>
  );
};

export default Dashboard;