import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, useToast, Spinner, Table, Thead, Tbody, Tr, Th, Td, VStack, Icon, Center, InputGroup, InputLeftElement, Input, IconButton, Link, HStack } from '@chakra-ui/react';
import api from '../api';
import { FiMail, FiUsers, FiSearch, FiMessageSquare } from 'react-icons/fi';

const LadysPanel = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await api.get('/admin/emergency-contacts');
        setContacts(response.data);
        setFilteredContacts(response.data);
      } catch (error) {
        toast({ title: 'Erro ao carregar contatos.', status: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    const results = contacts.filter(c =>
      (c.full_name && c.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.emergency_contact_name && c.emergency_contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredContacts(results);
  }, [searchTerm, contacts]);

  const formatPhoneForLink = (phone) => {
    if (!phone) return '';
    return `https://wa.me/55${String(phone).replace(/\D/g, '')}`;
  };

  if (isLoading) {
    return (<Center h="50vh"><Spinner size="xl" color="orange.500" /></Center>);
  }

  return (
    <Box p={6} bg="white" borderRadius="xl" boxShadow="lg">
      <Heading size="lg" mb={2} color="gray.700">Painel Ladys</Heading>
      <Text color="gray.500" mb={6}>Lista de contatos de emergência (esposas/mães).</Text>
      
      <InputGroup mb={5}>
        <InputLeftElement pointerEvents="none">
          <Icon as={FiSearch} color="gray.300" />
        </InputLeftElement>
        <Input
          placeholder="Buscar por nome do participante ou do contato..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          focusBorderColor="pink.400"
        />
      </InputGroup>
      
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Participante</Th>
              <Th>Contato de Emergência</Th>
              <Th>Telefone</Th>
              <Th>Contato Rápido</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredContacts.map((c, index) => (
              <Tr key={index} _hover={{ bg: 'gray.50' }}>
                <Td fontWeight="medium">{c.full_name}</Td>
                <Td>{c.emergency_contact_name}</Td>
                <Td>{c.emergency_contact_phone}</Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      as={Link}
                      href={formatPhoneForLink(c.emergency_contact_phone)}
                      isExternal
                      aria-label="WhatsApp"
                      icon={<Icon as={FiMessageSquare} />}
                      colorScheme="whatsapp"
                      size="sm"
                      isDisabled={!c.emergency_contact_phone}
                    />
                    <IconButton
                      as={Link}
                      href={`mailto:${c.emergency_contact_email}`}
                      aria-label="Email"
                      icon={<Icon as={FiMail} />}
                      colorScheme="gray"
                      size="sm"
                      isDisabled={!c.emergency_contact_email}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default LadysPanel;