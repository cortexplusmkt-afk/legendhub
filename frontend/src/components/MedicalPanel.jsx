import React, { useEffect, useState } from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Button, Link, useToast, Text, HStack, Icon, Skeleton, VStack, InputGroup, InputLeftElement, Input } from '@chakra-ui/react';
import api from '../api'; // <<< USA NOSSO MENSAGEIRO OFICIAL
import { FiCheckCircle, FiXCircle, FiInbox, FiSearch } from 'react-icons/fi';

const MedicalPanel = () => { // O token não é mais recebido aqui
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      // A chamada agora é mais limpa, sem o objeto 'headers'
      const response = await api.get('/medical/pending');
      setSubmissions(response.data);
      setFilteredSubmissions(response.data);
    } catch (error) {
      toast({ title: 'Erro ao buscar atestados.', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []); // O token não é mais uma dependência

  useEffect(() => {
    const results = submissions.filter(sub =>
      sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.cpf && sub.cpf.includes(searchTerm))
    );
    setFilteredSubmissions(results);
  }, [searchTerm, submissions]);


  const handleValidate = async (participantId, status) => {
    try {
      // A chamada agora é mais limpa, sem o objeto 'headers'
      await api.post(`/medical/validate/${participantId}`, { status });
      toast({ title: `Participante ${status === 'approved' ? 'aprovado' : 'rejeitado'}!`, status: 'success' });
      fetchSubmissions();
    } catch (error) {
      toast({ title: 'Erro ao validar.', description: error.response?.data?.message, status: 'error' });
    }
  };
  
  if (isLoading) {
    return (
      <Box p={{ base: 4, md: 6 }} bg="white" borderRadius="xl" boxShadow="lg">
        <Heading size="lg" mb={5}>Painel de Validação Médica</Heading>
        <VStack spacing={4}>
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="40px" />
        </VStack>
      </Box>
    );
  }
  
  return (
    <Box p={{ base: 4, md: 6 }} bg="white" borderRadius="xl" boxShadow="lg">
      <Heading size="lg" mb={5} color="gray.700">Painel de Validação Médica</Heading>
      
      <InputGroup mb={5}>
        <InputLeftElement pointerEvents="none">
          <Icon as={FiSearch} color="gray.300" />
        </InputLeftElement>
        <Input
          placeholder="Buscar por nome ou CPF na lista de pendentes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          focusBorderColor="orange.400"
        />
      </InputGroup>

      {submissions.length === 0 ? (
        <VStack spacing={4} p={10}>
          <Icon as={FiInbox} boxSize={12} color="gray.400" />
          <Heading size="md" color="gray.600">Tudo em dia!</Heading>
          <Text color="gray.500">Nenhum atestado pendente de análise no momento.</Text>
        </VStack>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nome do Participante</Th>
                <Th>CPF</Th>
                <Th>Atestado</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredSubmissions.map((sub) => (
                <Tr key={sub.id}>
                  <Td>{sub.full_name}</Td>
                  <Td>{sub.cpf}</Td>
                  <Td><Link href={sub.file_url} isExternal color="orange.500" fontWeight="bold">Ver Atestado</Link></Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button colorScheme="green" size="sm" onClick={() => handleValidate(sub.id, 'approved')} leftIcon={<Icon as={FiCheckCircle} />}>Aprovar</Button>
                      <Button colorScheme="red" size="sm" onClick={() => handleValidate(sub.id, 'rejected')} leftIcon={<Icon as={FiXCircle} />}>Reprovar</Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default MedicalPanel;